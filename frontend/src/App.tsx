import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { SessionList } from "./components/SessionList";
import { SessionDetail } from "./components/SessionDetail";
import { SearchResults } from "./components/SearchResults";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SessionList />} />
          <Route path="session/:id" element={<SessionDetail />} />
          <Route path="search" element={<SearchResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
