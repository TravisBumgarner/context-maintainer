import { useUIStore } from "../../stores";
import { MODAL_ID } from "./Modal.consts";
import WhatsNewModal from "./components/WhatsNewModal";
import UpdateModal from "./components/UpdateModal";
import FeedbackModal from "./components/FeedbackModal";
import TimerSettingsModal from "./components/TimerSettingsModal";
import CommonAppsModal from "./components/CommonAppsModal";

export default function RenderModal() {
  const activeModal = useUIStore((s) => s.activeModal);

  if (!activeModal) return null;

  switch (activeModal) {
    case MODAL_ID.WHATS_NEW:
      return <WhatsNewModal />;
    case MODAL_ID.UPDATE:
      return <UpdateModal />;
    case MODAL_ID.FEEDBACK:
      return <FeedbackModal />;
    case MODAL_ID.TIMER_SETTINGS:
      return <TimerSettingsModal />;
    case MODAL_ID.COMMON_APPS:
      return <CommonAppsModal />;
    default:
      return null;
  }
}
