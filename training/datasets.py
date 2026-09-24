"""
Gaia-HAT Paired Dataset
Loads co-registered LR/HR scene pairs (see README.md "Preparing training data" for the
expected .npz layout) and serves randomly cropped, augmented training patches.
"""

from __future__ import annotations

from pathlib import Path
from typing import Tuple

import numpy as np
import torch
from torch.utils.data import Dataset

from engine.inference import normalize_reflectance


class PairedSRDataset(Dataset):
    """
    Each .npz file in `root_dir` must contain:
      - "lr": array [4, H, W]      -- Sentinel-2-style 10 m, 4-band (Red, Green, Blue, NIR)
      - "hr": array [4, H*scale, W*scale] -- co-registered high-res reference, same band order

    Pixel values may be raw (e.g. uint16 0-10000 surface reflectance) or already
    normalized to [0, 1] -- `normalize_reflectance` handles both, matching the exact
    normalization the inference engine applies to uploaded files.

    Every access returns a random `patch_size` x `patch_size` LR crop and its matching
    HR crop, with a random 90-degree rotation / flip (safe for co-registered pairs;
    arbitrary-angle rotation is not, since it would require resampling and could
    subtly misalign LR/HR).
    """

    def __init__(
        self,
        root_dir: str | Path,
        patch_size: int = 64,
        scale: int = 4,
        samples_per_scene: int = 16,
        augment: bool = True,
    ):
        self.files = sorted(Path(root_dir).glob("*.npz"))
        if not self.files:
            raise FileNotFoundError(f"No .npz pairs found under {root_dir}")
        self.patch_size = patch_size
        self.scale = scale
        self.samples_per_scene = samples_per_scene
        self.augment = augment

    def __len__(self) -> int:
        return len(self.files) * self.samples_per_scene

    def _load_pair(self, file_idx: int) -> Tuple[np.ndarray, np.ndarray]:
        npz = np.load(self.files[file_idx])
        lr = normalize_reflectance(npz["lr"])
        hr = normalize_reflectance(npz["hr"])
        return lr, hr

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        file_idx = idx % len(self.files)
        lr, hr = self._load_pair(file_idx)

        _, H, W = lr.shape
        ps = self.patch_size

        # Reflect-pad scenes smaller than one training patch.
        pad_h, pad_w = max(0, ps - H), max(0, ps - W)
        if pad_h > 0 or pad_w > 0:
            lr = np.pad(lr, ((0, 0), (0, pad_h), (0, pad_w)), mode="reflect")
            hr = np.pad(hr, ((0, 0), (0, pad_h * self.scale), (0, pad_w * self.scale)), mode="reflect")
            H, W = lr.shape[1], lr.shape[2]

        y0 = np.random.randint(0, H - ps + 1)
        x0 = np.random.randint(0, W - ps + 1)
        lr_patch = lr[:, y0:y0 + ps, x0:x0 + ps].copy()
        hr_patch = hr[
            :,
            y0 * self.scale:(y0 + ps) * self.scale,
            x0 * self.scale:(x0 + ps) * self.scale,
        ].copy()

        if self.augment:
            if np.random.rand() < 0.5:
                lr_patch = np.flip(lr_patch, axis=2).copy()
                hr_patch = np.flip(hr_patch, axis=2).copy()
            if np.random.rand() < 0.5:
                lr_patch = np.flip(lr_patch, axis=1).copy()
                hr_patch = np.flip(hr_patch, axis=1).copy()
            k = np.random.randint(0, 4)
            if k > 0:
                lr_patch = np.rot90(lr_patch, k, axes=(1, 2)).copy()
                hr_patch = np.rot90(hr_patch, k, axes=(1, 2)).copy()

        return torch.from_numpy(lr_patch), torch.from_numpy(hr_patch)
