import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen">
      <AppSidebar />

      <main className="md:ml-[220px] min-h-screen pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
