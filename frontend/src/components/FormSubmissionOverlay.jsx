import React, { useEffect, useState, useRef, useCallback } from 'react';
import './FormSubmissionOverlay.css';

const LOTTIE_SUCCESS_URL = 'https://lottie.host/40c3ec20-2124-452f-be4a-3baaad09d198/ywitHaEiao.lottie';
const FADE_OUT_MS = 300;
const FALLBACK_MS = 3000;

const FormSubmissionOverlay = ({ isVisible, onAnimationComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [render, setRender] = useState(false);
  const lottieRef = useRef(null);
  const fallbackRef = useRef(null);
  const exitRef = useRef(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  useEffect(() => {
    if (isVisible) {
      completedRef.current = false;
      setRender(true);
      setIsExiting(false);
      if (exitRef.current) clearTimeout(exitRef.current);
    } else if (render) {
      setIsExiting(true);
      exitRef.current = setTimeout(() => {
        setRender(false);
        setIsExiting(false);
      }, FADE_OUT_MS);
      return () => {
        if (exitRef.current) clearTimeout(exitRef.current);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    if (!render) return;

    const el = lottieRef.current;
    if (!el) return;

    const onComplete = () => handleComplete();

    try {
      const target = el.dotLottie || el;
      target.addEventListener('complete', onComplete);
      fallbackRef.current = setTimeout(handleComplete, FALLBACK_MS);

      return () => {
        target.removeEventListener?.('complete', onComplete);
        if (fallbackRef.current) {
          clearTimeout(fallbackRef.current);
          fallbackRef.current = null;
        }
      };
    } catch {
      fallbackRef.current = setTimeout(handleComplete, FALLBACK_MS);
      return () => {
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
      };
    }
  }, [render, handleComplete]);

  useEffect(() => () => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
    if (exitRef.current) clearTimeout(exitRef.current);
  }, []);

  if (!render) return null;

  return (
    <div
      className={`form-submission-overlay ${isExiting ? 'fade-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Form submitted successfully"
    >
      <div className="form-submission-overlay-animation">
        <dotlottie-wc
          ref={lottieRef}
          src={LOTTIE_SUCCESS_URL}
          autoplay
          loop={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default FormSubmissionOverlay;
