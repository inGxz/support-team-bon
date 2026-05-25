export async function POST(req: Request) {

  try {

    const body = await req.json();
    const code = body.code;

    const tokenRes = await fetch(
      "https://api.line.me/oauth2/v2.1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: "https://support-team-bon.vercel.app/auth/callback",
          client_id: "2010190087",
          client_secret: "2b27d6c469937eafb0f817b9c8592a2f",
        }),
      }
    );

    const token = await tokenRes.json();

    if (!token.access_token) {
      return Response.json({
        error: "TOKEN_FAILED",
        detail: token
      }, { status: 400 });
    }

    const profileRes = await fetch(
      "https://api.line.me/v2/profile",
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    const profile = await profileRes.json();

    return Response.json({
      name: profile.displayName,
      userId: profile.userId,
      picture: profile.pictureUrl,
    });

  } catch (err) {

    return Response.json({
      error: "SERVER_ERROR",
      detail: String(err)
    }, { status: 500 });

  }
}