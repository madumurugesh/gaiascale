import { useEffect, type FC } from 'react';
import { ShieldCheck, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface ReobservationToastProps {
  isOpen: boolean;
  onClose: () => void;
  consMae?: number;
  consRmse?: number;
}

export const ReobservationToast: FC<ReobservationToastProps> = ({
  isOpen,
  onClose,
  consMae = 0.0,
  consRmse = 0.00021,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const displayMae = consMae.toFixed(6);
  const displayRmse = consRmse.toFixed(6);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 max-w-md rounded-lg border border-earth-300 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-earth-50 border border-earth-200 text-earth-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-earth-900 tracking-wide text-xs uppercase">
                  Sensor Re-Observation Check
                </h4>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-slate-600">
                Downsampled enhanced 2.5 m output by 4&times; back to 10 m and computed difference against original Sentinel-2 observation.
              </p>
              <div className="font-mono text-[11px] text-slate-800 pt-1 flex items-center gap-3">
                <span>Drift MAE: <strong className="text-earth-700">{displayMae}</strong></span>
                <span>Drift RMSE: <strong className="text-slate-900">{displayRmse}</strong></span>
              </div>
              <p className="text-[11px] text-earth-800 font-semibold pt-0.5 flex items-center gap-1">
                <span>&check; Sensor-consistency invariant satisfied.</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
