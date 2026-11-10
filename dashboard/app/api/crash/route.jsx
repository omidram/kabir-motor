export async function POST() {
  try {
    const token =
      "Bearer q821IqGrSP0QAvPGlEKk+iaxmeOcUX0N9wISU/jY9idLjeWNLNbsvQqxdMlD4gVNcWyT+/tHemk1TeB4XAS29WLMmf2OKHeCcPb2oobfgpU="

    const smsRes = await fetch("https://s.api.ir/api/sw1/SendSms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({
        mobiles: ["09356197570"]
      })
    })

    const smsData = await smsRes.json()

    return Response.json(smsData)
  } catch (e) {
    return Response.json(
      { success: false, error: "server error" },
      { status: 500 }
    )
  }
}