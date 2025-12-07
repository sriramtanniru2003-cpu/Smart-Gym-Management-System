import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarTrainer from '../../components/trainer/NavbarTrainer';

const TrainerLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarTrainer />
      <main className="pt-16"> {/* Padding top for fixed navbar */}
        <Outlet />
      </main>
    </div>
  );
};

export default TrainerLayout;