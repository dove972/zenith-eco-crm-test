import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await request.json();

  // Service role client required for admin.createUser
  const adminClient = createAdminClient();

  // Only pass minimal metadata to avoid trigger issues with UUID casting
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password || "TempPass123!",
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name || "",
        last_name: body.last_name || "",
        role: body.role || "commercial",
      },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update profile with ALL fields (phone, manager_id) via service role
  // The trigger handle_new_user() already created the base profile row
  if (authData.user) {
    const updateData: Record<string, unknown> = {
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
    };

    if (body.phone) updateData.phone = body.phone;
    if (body.manager_id) updateData.manager_id = body.manager_id;

    await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", authData.user.id);
  }

  return NextResponse.json({ success: true, data: authData.user });
}
