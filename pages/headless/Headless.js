import { parse } from "jsurl2";
import { useRouter } from "next/router";
import Legend from "../../components/Legend";
import Planner from "../../components/Planner";
import * as defaultConfig from "../../components/Planner/defaultConfig";
import styles from "./headless.module.css";

const OG_IMAGE_HEIGHT = 627;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_MARGIN = 20;

// Scale UI to 2x for og:image rendering
const SCALED_CONFIG = {};
Object.entries(defaultConfig).forEach(([key, value]) => {
  if (typeof value === "number") {
    SCALED_CONFIG[key] = value * 2;
  } else {
    SCALED_CONFIG[key] = value;
  }
});

const OUTER_STYLE = {
  padding: `${OG_IMAGE_MARGIN}px`,
  width: OG_IMAGE_WIDTH,
  height: OG_IMAGE_HEIGHT,
  fontSize: `${SCALED_CONFIG.FONT_SIZE_NORMAL}px`,
};

const INNER_STYLE = {
  marginTop: `${OG_IMAGE_MARGIN}px`,
  padding: `${OG_IMAGE_MARGIN}px`,
};

export default function Headless() {
  const { query } = useRouter();

  const keys = Object.keys(query);
  if (keys.length === 0) {
    return null;
  }

  const { tasks, team } = parse(keys[0], { deURI: true });

  const scale = window.devicePixelRatio;

  return (
    <div id="ogImageContainer" className={styles.Container} style={OUTER_STYLE}>
      <div>
        <Legend
          avatarSize={SCALED_CONFIG.AVATAR_SIZE}
          tasks={tasks}
          team={team}
        />
        <div className={styles.Canvas} style={INNER_STYLE}>
          <Planner
            config={SCALED_CONFIG}
            tasks={tasks}
            team={team}
            width={OG_IMAGE_WIDTH - OG_IMAGE_MARGIN * 4}
          />
        </div>
      </div>
    </div>
  );
}
