const Loading3D = () => {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0)",
        opacity: 0.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <div
        className="spinner"
        style={{
          width: 50,
          height: 50,
          border: "5px solid #fff",
          borderTop: "5px solid #1990ff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      ></div>
      <h3 style={{ marginTop: 20 }}>Đang khởi tạo môi trường 3D...</h3>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Loading3D;
