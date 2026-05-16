const state = {
  role: "public",
  startedAt: null,
  timerId: null,
  rate: 112,
  depth: 4.8,
  recoil: 91,
};

const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".tab");
const segments = document.querySelectorAll(".segment");
const scoreRing = document.querySelector(".score-ring");

const elements = {
  score: document.getElementById("score"),
  timer: document.getElementById("timer"),
  rateInput: document.getElementById("rateInput"),
  depthInput: document.getElementById("depthInput"),
  recoilInput: document.getElementById("recoilInput"),
  rateMeter: document.getElementById("rateMeter"),
  depthMeter: document.getElementById("depthMeter"),
  recoilMeter: document.getElementById("recoilMeter"),
  rateText: document.getElementById("rateText"),
  depthText: document.getElementById("depthText"),
  recoilText: document.getElementById("recoilText"),
  coachNote: document.getElementById("coachNote"),
  teamScore: document.getElementById("teamScore"),
  reportCompression: document.getElementById("reportCompression"),
  reportGrade: document.getElementById("reportGrade"),
  debriefNotes: document.getElementById("debriefNotes"),
};

const prompts = {
  compression: "圧迫のテンポ、深度、リコイルのうち、最も改善効果が高い項目を1つ選び、次回の行動目標に落とし込んでください。",
  team: "リーダー、圧迫担当、AED担当の役割宣言は明確でしたか。閉ループコミュニケーションの成功例と改善点を記録してください。",
  aed: "AED到着から解析までの手順、中断時間、周囲安全確認のタイミングを振り返ってください。",
};

function setView(viewId) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewId));
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
}

function setRole(role) {
  state.role = role;
  segments.forEach((segment) => segment.classList.toggle("active", segment.dataset.role === role));
  elements.teamScore.textContent = role === "provider" ? "87%" : "任意";
  document.getElementById("targetDepth").textContent = role === "provider" ? "5-6 cm" : "強く速く";
  document.getElementById("guidelineCopy").textContent =
    role === "provider"
      ? "医療従事者向けにはAHA/ERC/ILCORの参照プロファイルに加え、施設プロトコル、役割分担、チーム行動評価を紐づけます。"
      : "一般市民向けには認識、通報、胸骨圧迫、AED使用を中心に、迷わず行動できる訓練体験を優先します。";
}

function scoreRange(value, min, max, tolerance) {
  if (value >= min && value <= max) return 100;
  const distance = value < min ? min - value : value - max;
  return Math.max(45, Math.round(100 - distance * tolerance));
}

function updateFeedback() {
  state.rate = Number(elements.rateInput.value);
  state.depth = Number(elements.depthInput.value);
  state.recoil = Number(elements.recoilInput.value);

  const rateScore = scoreRange(state.rate, 100, 120, 2.2);
  const depthScore = scoreRange(state.depth, 5, 6, 24);
  const recoilScore = Math.min(100, Math.max(45, state.recoil));
  const total = Math.round(rateScore * 0.34 + depthScore * 0.38 + recoilScore * 0.28);

  elements.rateMeter.value = state.rate;
  elements.depthMeter.value = state.depth;
  elements.recoilMeter.value = state.recoil;
  elements.score.textContent = total;
  scoreRing.style.setProperty("--score", total);
  elements.reportCompression.textContent = `${total}%`;
  elements.reportGrade.textContent = total >= 90 ? "A" : total >= 82 ? "A-" : total >= 74 ? "B" : "要改善";

  elements.rateText.textContent = state.rate < 100 ? "テンポを上げる" : state.rate > 120 ? "テンポ過多" : "適正範囲内";
  elements.depthText.textContent = state.depth < 5 ? "やや浅い" : state.depth > 6 ? "やや深い" : "適正範囲内";
  elements.recoilText.textContent = state.recoil >= 85 ? "良好" : "胸郭の戻りを意識";

  if (total >= 90) {
    elements.coachNote.textContent = "全体品質は高水準です。次は中断時間とチーム内の声かけ精度を中心に確認してください。";
  } else if (state.depth < 5) {
    elements.coachNote.textContent = "圧迫テンポは維持できています。深度が浅くなる局面があるため、疲労前の交代タイミングを明確化してください。";
  } else {
    elements.coachNote.textContent = "圧迫品質にばらつきがあります。短い声かけ、交代基準、AED解析前後の手順を絞って振り返ってください。";
  }
}

function startTimer() {
  state.startedAt = Date.now();
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const rest = String(seconds % 60).padStart(2, "0");
    elements.timer.textContent = `${minutes}:${rest}`;
  }, 500);
}

tabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
segments.forEach((segment) => segment.addEventListener("click", () => setRole(segment.dataset.role)));

document.getElementById("startTraining").addEventListener("click", () => {
  startTimer();
  setView("feedback");
});

document.getElementById("resetSession").addEventListener("click", () => {
  clearInterval(state.timerId);
  state.startedAt = null;
  elements.timer.textContent = "00:00";
  elements.rateInput.value = 112;
  elements.depthInput.value = 4.8;
  elements.recoilInput.value = 91;
  updateFeedback();
  setView("train");
});

document.getElementById("exportReport").addEventListener("click", () => {
  setView("debrief");
  elements.debriefNotes.value = "PDF出力前確認: 圧迫品質、AED導線、中断管理、チーム連携、次回課題をレビュー。";
});

document.getElementById("saveDebrief").addEventListener("click", () => {
  const note = elements.debriefNotes.value.trim();
  elements.debriefNotes.value = note ? `${note}\n保存済み: 次回訓練に反映` : "保存済み: 次回訓練に反映";
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.debriefNotes.value = prompts[button.dataset.prompt];
    elements.debriefNotes.focus();
  });
});

[elements.rateInput, elements.depthInput, elements.recoilInput].forEach((input) => {
  input.addEventListener("input", updateFeedback);
});

setRole("public");
updateFeedback();
