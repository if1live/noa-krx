import { useState } from "react";
import { EtfPage } from "./EtfPage";
import { KofiaPage } from "./KofiaPage";

type MenuType = "kofia" | "etf";

export const App = () => {
  // TODO: react-router로 교체. hash router 써야한다
  // TODO: mantine 같은거 붙이나?
  const [menu, setMenu] = useState<MenuType>("etf");

  return (
    <>
      <h1>noa</h1>
      <button type="button" onClick={() => setMenu("etf")}>
        etf
      </button>
      <button type="button" onClick={() => setMenu("kofia")}>
        kofia
      </button>
      {menu === "kofia" ? <KofiaPage /> : null}
      {menu === "etf" ? <EtfPage /> : null}
    </>
  );
};
