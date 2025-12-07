import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Make sure you have this component

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;