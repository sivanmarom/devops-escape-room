import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Level1 from "./pages/Level1";
import "./App.css";
import Level2 from "./pages/Level2";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/level1" element={<Level1 />} />
        <Route path="/level2" element={<Level2 />} />
      </Routes>
    </BrowserRouter>
  );
}