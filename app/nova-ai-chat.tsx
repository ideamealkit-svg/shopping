"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string };

const apiUrl = (process.env.NEXT_PUBLIC_NOVA_AI_API_URL ?? "").replace(/\/$/, "");
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요. NOVA 사운드 가이드입니다. 취향과 사용 환경을 알려주시면 가장 잘 맞는 헤드폰을 함께 찾아드릴게요.",
};
const quickPrompts = ["출퇴근용 헤드폰 추천", "AURA H1과 NOIR X 비교", "배송과 반품 안내"];

function localGuideReply(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("aura") && normalized.includes("noir")) {
    return "AURA H1은 40mm 드라이버와 알루미늄 하우징의 균형 잡힌 시그니처 사운드가 강점이고, NOIR X는 이동 중 소음을 줄이는 적응형 노이즈 캔슬링에 집중한 모델입니다. 집에서 음질을 우선하면 AURA H1, 출퇴근과 비행이 많다면 NOIR X를 추천해요.";
  }
  if (normalized.includes("출퇴근") || normalized.includes("소음") || normalized.includes("노이즈")) {
    return "출퇴근용으로는 적응형 노이즈 캔슬링을 갖춘 NOIR X가 가장 잘 맞습니다. 가벼운 착용감과 공간감이 중요하면 TIDE S도 함께 비교해 보세요.";
  }
  if (normalized.includes("배송") || normalized.includes("반품") || normalized.includes("교환")) {
    return "기본 배송은 결제 완료 후 영업일 기준 1–3일 내 출고됩니다. 단순 변심 교환·반품은 수령 후 7일 이내, 제품과 패키지가 훼손되지 않은 경우 접수할 수 있어요. 주문별 상태는 마이페이지에서 확인할 수 있습니다.";
  }
  if (normalized.includes("추천") || normalized.includes("헤드폰")) {
    return "가장 정교한 균형감은 AURA H1, 강한 소음 제어는 NOIR X, 가볍고 넓은 공간감은 TIDE S, 섬세한 모니터링은 ECHO PRO가 잘 맞습니다. 주로 듣는 음악과 사용하는 장소를 알려주시면 한 모델로 좁혀드릴게요.";
  }
  return "현재 AI 연결 전에도 제품과 배송에 관한 기본 안내를 드릴 수 있어요. ‘출퇴근용 추천’, ‘AURA H1 비교’, ‘반품 안내’처럼 질문해 주세요.";
}

export default function NovaAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connected = Boolean(apiUrl);

  const statusLabel = useMemo(() => connected ? "GROQ · GPT-OSS 20B" : "NOVA QUICK GUIDE", [connected]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const ask = async (rawQuestion: string) => {
    const question = rawQuestion.trim().slice(0, 500);
    if (!question || loading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setNotice("");
    setLoading(true);

    if (!connected) {
      window.setTimeout(() => {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: localGuideReply(question) }]);
        setNotice("Groq 보안 API가 연결되면 더 자연스러운 맞춤 답변으로 전환됩니다.");
        setLoading(false);
      }, 420);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok || !body.message) throw new Error(body.error || "AI 응답을 받지 못했습니다.");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: body.message! }]);
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: localGuideReply(question) }]);
      setNotice(error instanceof Error ? `${error.message} 기본 안내로 답변했어요.` : "AI 연결이 지연되어 기본 안내로 답변했어요.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(input);
    }
  };

  return (
    <div className={open ? "nova-ai is-open" : "nova-ai"}>
      {open && (
        <section className="nova-ai-panel" role="dialog" aria-modal="false" aria-label="NOVA AI 사운드 가이드">
          <header className="nova-ai-header">
            <div><span className="nova-ai-orb" aria-hidden="true" /><div><p>NOVA SOUND GUIDE</p><span>{statusLabel}</span></div></div>
            <button type="button" aria-label="AI 채팅 닫기" onClick={() => setOpen(false)}>×</button>
          </header>

          <div className="nova-ai-messages" ref={listRef} aria-live="polite">
            {messages.map((message) => (
              <div className={`nova-ai-message is-${message.role}`} key={message.id}>
                {message.role === "assistant" && <span>AI</span>}
                <p>{message.content}</p>
              </div>
            ))}
            {loading && <div className="nova-ai-message is-assistant is-loading"><span>AI</span><p><i /><i /><i /></p></div>}
          </div>

          {messages.length < 4 && (
            <div className="nova-ai-prompts" aria-label="빠른 질문">
              {quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => void ask(prompt)}>{prompt}</button>)}
            </div>
          )}

          <form className="nova-ai-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="nova-ai-input">NOVA AI에게 질문하기</label>
            <input id="nova-ai-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleInputKeyDown} maxLength={500} placeholder="어떤 사운드를 찾고 있나요?" autoComplete="off" />
            <button type="submit" disabled={!input.trim() || loading} aria-label="메시지 보내기">↗</button>
          </form>
          <footer><span>{notice || "AI 답변은 실제 상품 정보와 다를 수 있습니다."}</span></footer>
        </section>
      )}

      <button className="nova-ai-launcher" type="button" aria-label={open ? "AI 채팅 닫기" : "AI 사운드 가이드 열기"} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="nova-ai-launcher-mark" aria-hidden="true">N</span>
        <span className="nova-ai-launcher-label"><b>AI GUIDE</b><small>무엇이든 물어보세요</small></span>
        <i aria-hidden="true">{open ? "×" : "↗"}</i>
      </button>
    </div>
  );
}
