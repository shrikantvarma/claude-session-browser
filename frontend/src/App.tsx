import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { SessionList } from "./components/SessionList";
import { SessionDetail } from "./components/SessionDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SessionList />} />
          <Route path="session/:id" element={<SessionDetail />} />
          <Route
            path="search"
            element={
              <div className="p-6 text-text-secondary">Search (Plan 02)</div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
