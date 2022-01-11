import { useRouter } from "next/router";
import Legend from "../../components/Legend";
import Planner from "../../components/Planner";
import { parse } from "../../components/utils/url";
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

const OUTER_STYLE_CROPPED = {
  padding: `${OG_IMAGE_MARGIN}px`,
  width: OG_IMAGE_WIDTH,
  fontSize: `${SCALED_CONFIG.FONT_SIZE_NORMAL}px`,
};

const OUTER_STYLE = {
  ...OUTER_STYLE_CROPPED,
  height: OG_IMAGE_HEIGHT,
};

const INNER_STYLE = {
  marginTop: `${OG_IMAGE_MARGIN}px`,
  padding: `${OG_IMAGE_MARGIN}px`,
};

export default function Headless() {
  const {
    query: { cropped, data },
  } = useRouter();

  if (!data) {
    return null;
  }

  const { tasks, team } = parse(data);

  const scale = window.devicePixelRatio;

  return (
    <div
      id="ogImageContainer"
      className={styles.Container}
      style={cropped ? OUTER_STYLE_CROPPED : OUTER_STYLE}
    >
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
