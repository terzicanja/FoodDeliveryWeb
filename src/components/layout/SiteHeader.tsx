import { SiteHeaderNav, type HeaderUser } from "@/components/layout/SiteHeaderNav";
import { getAuthPayload } from "@/lib/auth-request";
import { prisma } from "@/lib/prisma";

export async function SiteHeader() {
  const auth = await getAuthPayload();
  let user: HeaderUser | null = null;

  if (auth) {
    const record = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (record) {
      user = record;
    }
  }

  return <SiteHeaderNav user={user} />;
}
