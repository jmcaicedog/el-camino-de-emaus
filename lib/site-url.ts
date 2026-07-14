import type { NextRequest } from "next/server"

function ensureAbsoluteUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  return `https://${value}`
}

export function getPublicSiteUrl(request?: NextRequest): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_BRANCH_URL ||
    process.env.VERCEL_URL

  if (configuredUrl) {
    return ensureAbsoluteUrl(configuredUrl).replace(/\/$/, "")
  }

  if (request) {
    return request.nextUrl.origin.replace(/\/$/, "")
  }

  return "http://localhost:3000"
}