import { redirect } from "next/navigation";

// 目次は表紙の画面の下にある。
export default function Toc() {
  redirect("/cover");
}
