// component/layout/MainLayout.jsx - CORRECT VERSION
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from "./Header";
import Navigation from "./Navigation";
import { LoadingSpinner } from "../common/Loading";

const MainLayout = () => {
  return (
    <div className="bg-gray-200 min-h-screen">
      <Header />
      <Navigation />
      <Suspense 
        fallback={
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {/* Outlet จะแสดง page component ที่ match กับ route */}
        <Outlet />
      </Suspense>
    </div>
  );
};

export default MainLayout;