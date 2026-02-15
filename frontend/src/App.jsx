import { useState, useEffect } from "react";
import Gate from "./components/Gate";

function App() {
  const [entered, setEntered] = useState(false);

  // useEffect(() => {
  //   const visited = localStorage.getItem("hasVisited");
  //   if (visited) {
  //     setEntered(true);
  //   }
  // }, []);

  const handleEnter = () => {
    // localStorage.setItem("hasVisited", "true");
    setEntered(true);
  };

  return (
    <>
      {!entered && <Gate onEnter={handleEnter} />}
      {entered && (
        <div style={{ color: "white", padding: "100px" }}>
          <h1>PK Sompura</h1>
          <p>Temple Architecture & Craft</p>
        </div>
      )}
    </>
  );
}

export default App;
