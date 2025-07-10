import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Page/Home";
// import Dashboard from "./Page/Dashboard";
import Acceuil from "./Page/Dashboard/Acceuil";
import Dashboard from "./Page/Dashboard";
import Dash from "./Page/Dashboard/Dash";
import Export from "./Page/Dashboard/Export";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control/" element={<Dashboard />} >
          <Route index path="camera" element={<Acceuil />}/>
          <Route path="dashboard" element={<Dash />}/>
          <Route path="export" element={<Export />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
