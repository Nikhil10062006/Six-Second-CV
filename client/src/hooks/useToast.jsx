import { useState, useEffect } from "react";

export const useToast = (duration = 3000) => {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    success: false,
  });

  useEffect(() => {
    if (toast.show) {
      const timeoutId = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  }, [toast.show]);

  function showToast(message, success = false) {
    setToast({ show: true, message, success });
  }

  return { toast, showToast };
};
