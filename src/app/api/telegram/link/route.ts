import { getUser } from "@/lib/auth";
import { error, notImplemented } from "@/lib/http";

export async function POST() {
  if (!(await getUser())) {
    return error("No autorizado", 401);
  }
  return notImplemented();
}