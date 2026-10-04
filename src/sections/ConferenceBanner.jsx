import { CONFERENCE } from "../conference.js";

export default function ConferenceBanner() {
  const { date, name, registrationUrl } = CONFERENCE;
  return (
    <aside aria-label="Zapowiedź konferencji" className="conference">
      <p><span className="num">{date}</span>: {name}</p>
      {registrationUrl && (
        <a className="btn" href={registrationUrl} target="_blank" rel="noopener noreferrer">Zarejestruj się</a>
      )}
    </aside>
  );
}
