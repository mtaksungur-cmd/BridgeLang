// components/videos/GeneralIntroVideo.jsx
import React from "react";
import styles from "./VideoWrapper.module.scss";

export default function GeneralIntroVideo({ videoId }) {
  return (
    <div className={styles.videoWrapper}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&mute=1&autoplay=1&playsinline=1`}
        title="BridgeLang Intro Video"
        loading="lazy"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}
