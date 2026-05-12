import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./src/i18n/routing";
export default createMiddleware({ locales, defaultLocale });
export const config = { matcher: ["/", "/(pt-br|en|es)/:path*"] };
