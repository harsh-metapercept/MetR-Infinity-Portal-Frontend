import { useEffect } from "react";

export function useLinkHandler(messagesContainer) {
  useEffect(() => {
    if (!messagesContainer) return;

    const handleLinkClick = (event) => {
      const target = event.target;
      if (target.tagName === "A" && target.href) {
        event.preventDefault();

        try {
          const linkUrl = new URL(target.href);
          const currentDomain = window.location.hostname;

          if (linkUrl.hostname === currentDomain) {
            window.location.href = target.href;
          } else {
            window.open(target.href, "_blank", "noopener,noreferrer");
          }
        } catch (error) {
          console.error("Invalid URL:", target.href);
          window.open(target.href, "_blank", "noopener,noreferrer");
        }
      }
    };

    messagesContainer.addEventListener("click", handleLinkClick);

    return () => {
      messagesContainer.removeEventListener("click", handleLinkClick);
    };
  }, [messagesContainer]);
}
