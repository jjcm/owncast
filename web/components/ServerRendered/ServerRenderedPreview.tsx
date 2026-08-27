/* eslint-disable react/no-danger */
import { FC } from 'react';
import offlineBannerStyles from '../ui/OfflineBanner/OfflineBanner.module.scss';
import customPageContentStyles from '../ui/CustomPageContent/CustomPageContent.module.scss';
import contentStyles from '../ui/Content/Content.module.scss';

// A server-rendered preview of the offline page painted before any
// JavaScript loads. The static export emits Go template placeholders that the
// Owncast server substitutes when serving index.html (the same mechanism as
// ServerRenderedHydration), so the largest content on the page is visible at
// first paint instead of waiting for the client bundle to boot. React leaves
// the substituted markup alone because dangerouslySetInnerHTML is not
// compared during hydration, and the whole block unmounts once the app
// finishes booting and renders the real page.
//
// The template only emits content when the stream is offline; when online the
// container stays empty and the regular loading spinner shows (see the
// :not(:empty) rule in Content.module.scss).
const serverRenderedPreviewTemplate = [
  '{{if .Offline}}',
  `<div id="offline-banner-preview" class="${offlineBannerStyles.outerContainer} ${contentStyles.topSectionElement}">`,
  `<div class="${offlineBannerStyles.innerContainer}">`,
  `<div class="${offlineBannerStyles.bodyText}">`,
  '{{if .OfflineMessageHTML}}{{.OfflineMessageHTML}}{{else}}This stream is offline. Check back soon!{{end}}',
  '</div></div></div>',
  '{{if .ExtraPageContentHTML}}',
  `<div class="${contentStyles.bottomPageContentContainer}">`,
  `<div class="${customPageContentStyles.customPageContent}">{{.ExtraPageContentHTML}}</div>`,
  '</div>',
  '{{end}}',
  '{{end}}',
].join('');

export type ServerRenderedPreviewProps = {
  className?: string;
};

export const ServerRenderedPreview: FC<ServerRenderedPreviewProps> = ({ className }) => (
  <div
    id="server-rendered-preview"
    className={className}
    dangerouslySetInnerHTML={{
      __html: process.env.NODE_ENV === 'production' ? serverRenderedPreviewTemplate : '',
    }}
  />
);
