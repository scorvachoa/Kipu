import { getUser } from "@/lib/auth";
import { error, notImplemented } from "@/lib/http";

export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/transactions/[id]">,
) {
  if (!(await getUser())) {
    return error("No autorizado", 401);
  }
  const { id } = await context.params;
  if (!id) {
    return notImplemented();
  }
  return notImplemented();
}