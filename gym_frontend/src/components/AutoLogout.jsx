// import { useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";

// export default function AutoLogout() {
//   const navigate = useNavigate();
//   const timeoutRef = useRef(null);

//   const LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

//   const resetTimer = () => {
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);

//     timeoutRef.current = setTimeout(() => {
//       localStorage.removeItem("token");
//       localStorage.removeItem("role");
//       navigate("/login");
//     }, LOGOUT_TIME);
//   };

//   useEffect(() => {
//     // Run only in browser
//     if (typeof window === "undefined") return;

//     resetTimer();

//     const events = ["mousemove", "keydown", "click", "scroll"];

//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer);
//     });

//     return () => {
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer);
//       });
//       clearTimeout(timeoutRef.current);
//     };
//   }, []);

//   return null;
// }


import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function AutoLogout() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, LOGOUT_TIME);
  }, [logout]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Start timer initially
    resetTimer();

    // Events considered as activity
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((e) => window.addEventListener(e, resetTimer));

    // Cleanup on unmount
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  return null;
}
