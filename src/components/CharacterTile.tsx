// One character as a tile: portrait, name, status and a line of detail. Rendered to HTML at build time on the
// static pages and by the explorer in the browser, so both look the same.
import type { Status } from "../lib/types";

interface Props {
  base: string;
  id: number;
  name: string;
  status: Status;
  species: string;
  /** The line under the status (last known location, an episode count, …). */
  meta?: string;
  /** Load the portrait at once (the first row of a page). */
  eager?: boolean;
  headingLevel?: 2 | 3;
}

export default function CharacterTile(props: Props) {
  const { base, id, name, status, species, meta, eager = false, headingLevel = 3 } = props;
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="tile">
      <img
        src={`https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`}
        alt=""
        width="300"
        height="300"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      <div className="tile-body">
        <Heading className="tile-name">
          <a href={`${base}characters/${id}/`}>{name}</a>
        </Heading>
        <span className="tile-facts">
          <span className="status" data-status={status}>
            <span className="visually-hidden">Status: </span>
            {status === "unknown" ? "Unknown" : status}
          </span>
          <span className="tile-species">
            <span className="visually-hidden">, species: </span>
            {species}
          </span>
        </span>
        {meta && <span className="tile-meta">{meta}</span>}
      </div>
    </article>
  );
}
