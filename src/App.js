import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import List from "./List";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<List />} />
      </Routes>
    </Router>
  );
}

export default App;
