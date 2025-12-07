// frontend/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-4">Page Not Found</p>
      <Link
        to="/"
        className="text-blue-500 underline hover:text-blue-700"
      >
        Go to Home
      </Link>
    </div>
  );
}
