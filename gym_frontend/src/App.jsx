import { useState } from "react";
import AutoLogout from "./components/AutoLogout";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";

function App() {
  const [showLayout, setShowLayout] = useState(true);
  
  return (
    <>
      {/* Auto logout */}
      <AutoLogout />
      
      {/* Pass layout visibility props to routes */}
      <AppRoutes
        showLayout={showLayout}
        setShowLayout={setShowLayout}
      />
    </>
  );
}

export default App;