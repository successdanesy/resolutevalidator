export async function validateAccount(accountNo, bankCode) {
    const res = await fetch("http://localhost:5000/api/validate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNo, bankCode }),
    });

    return res.json();
}
