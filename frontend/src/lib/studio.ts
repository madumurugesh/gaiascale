/** The studio is a separate application entry (frontend/studio/index.html). */
export const STUDIO_URL = '/studio/';

export const openStudio = () => {
  window.open(STUDIO_URL, '_blank', 'noopener,noreferrer');
};
