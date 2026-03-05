// components/videos/TeacherOnboardingVideo.jsx
import React from "react";
import styles from "./VideoWrapper.module.scss";

export default function TeacherOnboardingVideo({ videoId }) {
  return (
    <div className={styles.videoWrapper}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`}
        title="Teacher Onboarding Video"
        loading="lazy"
        allow="encrypted-media; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
