import { use } from "react";
import { HomeClient } from "@/app/home-client";

/** Next.js 16 passes `params` and `searchParams` as Promises; unwrap so devtools don’t sync-enumerate them. */
export default function Page(props: {
  params: Promise<Record<string, string | string[] | undefined>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  use(props.params);
  use(props.searchParams);
  return <HomeClient />;
}
