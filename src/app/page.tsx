import ChatModal from "@/components/ChatModal";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <ChatModal />
    </main>
  );
}
