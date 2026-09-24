#!/usr/bin/env python3
"""
Gaia-HAT Training Script

Trains the Gaia-HAT model (models/gaia_hat.py) on paired LR/HR scenes (see
README.md "Preparing training data"). Saves checkpoints in the exact format the
inference engine expects ({"state": model.state_dict(), ...}), so a trained
checkpoint can be dropped straight into checkpoints/gaia_hat_best.pt.

Example:
    python train.py --train-dir data/train --val-dir data/val --epochs 100
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from models.gaia_hat import GaiaHAT
from datasets import PairedSRDataset
from losses import GaiaHATLoss
from engine.metrics import compute_psnr, compute_ssim


def parse_args():
    p = argparse.ArgumentParser(description="Train Gaia-HAT on paired Sentinel-2/reference imagery.")
    p.add_argument("--train-dir", type=str, required=True, help="Directory of training .npz LR/HR pairs.")
    p.add_argument("--val-dir", type=str, default=None,
                   help="Directory of validation .npz pairs. If omitted, a fraction of --train-dir's "
                        "scenes (whole files, not patches) is held out via --val-frac.")
    p.add_argument("--val-frac", type=float, default=0.15, help="Held-out scene fraction when --val-dir is omitted.")

    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--batch-size", type=int, default=16)
    p.add_argument("--patch-size", type=int, default=64, help="LR training patch size in pixels.")
    p.add_argument("--samples-per-scene", type=int, default=16, help="Random crops drawn per scene per epoch.")
    p.add_argument("--num-workers", type=int, default=4)

    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--weight-decay", type=float, default=1e-4)
    p.add_argument("--grad-clip", type=float, default=1.0)
    p.add_argument("--recon-weight", type=float, default=1.0, help="Charbonnier reconstruction loss weight.")
    p.add_argument("--nll-weight", type=float, default=0.2, help="Laplace NLL (uncertainty) loss weight.")

    p.add_argument("--embed-dim", type=int, default=96)
    p.add_argument("--depths", type=str, default="4,4,4,4", help="Comma-separated RHAG depths.")
    p.add_argument("--num-heads", type=str, default="6,6,6,6", help="Comma-separated attention heads per RHAG.")

    p.add_argument("--checkpoint-dir", type=str, default="checkpoints")
    p.add_argument("--resume", type=str, default=None, help="Checkpoint to resume model+optimizer+epoch from.")
    p.add_argument("--val-interval", type=int, default=1, help="Validate every N epochs.")
    p.add_argument("--device", type=str, default="auto", choices=["auto", "cuda", "cpu"])
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def resolve_train_val_dirs(args) -> tuple[Path, Path]:
    if args.val_dir:
        return Path(args.train_dir), Path(args.val_dir)

    # Scene-level (whole-file) split, not patch-level, so validation scenes are never
    # spatially adjacent to training crops from the same file.
    all_files = sorted(Path(args.train_dir).glob("*.npz"))
    if len(all_files) < 2:
        sys.exit("[Error] Need at least 2 scenes to auto-split train/val. Pass --val-dir explicitly instead.")
    rng = random.Random(args.seed)
    shuffled = all_files[:]
    rng.shuffle(shuffled)
    n_val = max(1, int(len(shuffled) * args.val_frac))
    val_files = set(shuffled[:n_val])

    split_dir = Path(args.checkpoint_dir) / "_val_split"
    val_link_dir = split_dir / "val"
    train_link_dir = split_dir / "train"
    for d in (val_link_dir, train_link_dir):
        d.mkdir(parents=True, exist_ok=True)
    for f in all_files:
        target_dir = val_link_dir if f in val_files else train_link_dir
        link_path = target_dir / f.name
        if not link_path.exists():
            try:
                link_path.symlink_to(f.resolve())
            except OSError:
                # Symlinks may be unavailable (e.g. Windows without permissions) -- copy instead.
                import shutil
                shutil.copy2(f, link_path)
    print(f"[Gaia-HAT] Auto-split: {len(all_files) - len(val_files)} train scenes, {len(val_files)} val scenes.")
    return train_link_dir, val_link_dir


@torch.no_grad()
def validate(model: GaiaHAT, loader: DataLoader, criterion: GaiaHATLoss, device: torch.device) -> dict:
    model.eval()
    losses, psnrs, ssims = [], [], []
    for lr, hr in loader:
        lr, hr = lr.to(device), hr.to(device)
        sr, log_scale = model(lr)
        sr = sr.clamp(0.0, 1.0)
        _, parts = criterion(sr, log_scale, hr)
        losses.append(parts["total"])

        sr_np, hr_np = sr.cpu().numpy(), hr.cpu().numpy()
        for i in range(sr_np.shape[0]):
            psnrs.append(compute_psnr(sr_np[i], hr_np[i]))
            ssims.append(compute_ssim(sr_np[i], hr_np[i]))

    model.train()
    return {
        "loss": float(np.mean(losses)) if losses else float("nan"),
        "psnr": float(np.mean(psnrs)) if psnrs else float("nan"),
        "ssim": float(np.mean(ssims)) if ssims else float("nan"),
    }


def main():
    args = parse_args()
    set_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu") if args.device == "auto" \
        else torch.device(args.device)
    print(f"[Gaia-HAT] Training on device: {device}")

    train_dir, val_dir = resolve_train_val_dirs(args)
    train_ds = PairedSRDataset(train_dir, patch_size=args.patch_size,
                                samples_per_scene=args.samples_per_scene, augment=True)
    val_ds = PairedSRDataset(val_dir, patch_size=args.patch_size, samples_per_scene=4, augment=False)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,
                               num_workers=args.num_workers, drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)
    print(f"[Gaia-HAT] Train patches/epoch: {len(train_ds)} ({len(train_ds.files)} scenes) | "
          f"Val patches: {len(val_ds)} ({len(val_ds.files)} scenes)")

    depths = tuple(int(x) for x in args.depths.split(","))
    num_heads = tuple(int(x) for x in args.num_heads.split(","))
    model = GaiaHAT(in_chans=4, out_chans=4, embed_dim=args.embed_dim, depths=depths, num_heads=num_heads).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = GaiaHATLoss(recon_weight=args.recon_weight, nll_weight=args.nll_weight)

    start_epoch = 0
    best_psnr = -float("inf")
    if args.resume:
        ck = torch.load(args.resume, map_location=device)
        model.load_state_dict(ck["state"])
        if "optimizer" in ck:
            optimizer.load_state_dict(ck["optimizer"])
        start_epoch = ck.get("epoch", 0) + 1
        best_psnr = ck.get("val_psnr", best_psnr)
        print(f"[Gaia-HAT] Resumed from {args.resume} at epoch {start_epoch} (best PSNR so far: {best_psnr:.2f})")

    ckpt_dir = Path(args.checkpoint_dir)
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(start_epoch, args.epochs):
        model.train()
        running = {"total": 0.0, "recon": 0.0, "nll": 0.0}
        pbar = tqdm(train_loader, desc=f"Epoch {epoch + 1}/{args.epochs}")
        for lr_batch, hr_batch in pbar:
            lr_batch, hr_batch = lr_batch.to(device), hr_batch.to(device)

            optimizer.zero_grad()
            sr, log_scale = model(lr_batch)
            loss, parts = criterion(sr, log_scale, hr_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), args.grad_clip)
            optimizer.step()

            for k in running:
                running[k] += parts[k]
            pbar.set_postfix(loss=f"{parts['total']:.4f}", recon=f"{parts['recon']:.4f}", nll=f"{parts['nll']:.4f}")

        scheduler.step()
        n = len(train_loader)
        print(f"[Gaia-HAT] Epoch {epoch + 1}: train loss={running['total']/n:.4f} "
              f"(recon={running['recon']/n:.4f}, nll={running['nll']/n:.4f})")

        last_ckpt = {
            "state": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "epoch": epoch,
            "val_psnr": best_psnr,
        }
        torch.save(last_ckpt, ckpt_dir / "gaia_hat_last.pt")

        if (epoch + 1) % args.val_interval == 0 or epoch == args.epochs - 1:
            metrics = validate(model, val_loader, criterion, device)
            print(f"[Gaia-HAT] Epoch {epoch + 1} validation: "
                  f"loss={metrics['loss']:.4f} psnr={metrics['psnr']:.2f} dB ssim={metrics['ssim']:.4f}")
            if metrics["psnr"] > best_psnr:
                best_psnr = metrics["psnr"]
                torch.save(
                    {"state": model.state_dict(), "epoch": epoch, "val_psnr": best_psnr},
                    ckpt_dir / "gaia_hat_new_best.pt",
                )
                print(f"[Gaia-HAT] New best checkpoint saved (PSNR={best_psnr:.2f} dB) -> "
                      f"{ckpt_dir / 'gaia_hat_new_best.pt'}")

    print(f"\n[Gaia-HAT] Training complete. Best validation PSNR: {best_psnr:.2f} dB")
    print(f"[Gaia-HAT] Review '{ckpt_dir / 'gaia_hat_new_best.pt'}' and, if it beats the deployed checkpoint, "
          f"promote it by copying it over 'checkpoints/gaia_hat_best.pt'.")


if __name__ == "__main__":
    main()
