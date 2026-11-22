const Logo = ({ onClick }: { onClick: () => void }) => {
  return (
    <a className="brand" href="#home" onClick={onClick}>
      <span className="wordmark wordmark-sm">
        <span className="wm-elmo">ELMO</span>
        <span className="wm-c1">C</span>
        <span className="wm-p">P</span>
        <span className="wm-c2">C</span>
        <span className="wm-year"> 2026</span>
      </span>
    </a>
  );
};

export default Logo;
