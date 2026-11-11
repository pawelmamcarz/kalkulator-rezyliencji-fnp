import foundationLogo from "../../demo/public/rotunda/img/fnp-logo-black.png?inline";

export default function Header() {
  return (
    <header className="site-header">
      <div className="page site-header-inner">
        <img src={foundationLogo} width="1200" height="331" alt="Fundacja Nowe Przestrzenie" />
        <span>Kalkulator Rezyliencji FNP</span>
      </div>
    </header>
  );
}
