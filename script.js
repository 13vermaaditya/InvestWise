alert("JS Connected");

let currentUser = "";
let wallet = 0;
let portfolioChartInstance = null;

let portfolio = {
    gold: 0,
    stocks: 0,
    crypto: 0,
    fd: 0
};

// REGISTER
async function register(){
    let name = document.getElementById("username").value;

    if(name===""){
        alert("Enter your name");
        return;
    }

    const res = await fetch("http://localhost:5000/register",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({name:name})
    });

    const user = await res.json();

    if(user.error){
        alert(user.error);
        return;
    }

    // IMPORTANT
    currentUser = user.name;
    wallet = user.wallet;
    portfolio = user.portfolio;

    console.log("Registered user:", currentUser);

    document.querySelector(".main-container").style.display="none";
    document.getElementById("dashboardSection").style.display="block";

    document.getElementById("userDisplay").innerText=user.name;
    document.getElementById("wallet").innerText=user.wallet.toFixed(2);

    updateDashboard();
}

// LOGIN
async function login(){

    let name = document.getElementById("username").value;

    if(name===""){
        alert("Enter your name");
        return;
    }

    const res = await fetch("http://localhost:5000/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({name:name})
    });

    const user = await res.json();

    if(user.error){
        alert(user.error);
        return;
    }

    // IMPORTANT
    currentUser = user.name;
    wallet = user.wallet;
    portfolio = user.portfolio;

    console.log("Logged in user:", currentUser);

    document.querySelector(".main-container").style.display="none";
    document.getElementById("dashboardSection").style.display="block";

    document.getElementById("userDisplay").innerText=user.name;
    document.getElementById("wallet").innerText=user.wallet.toFixed(2);

    updateDashboard();
}


// BUY
async function buyAsset(asset, price){

    console.log("Buying:", asset, price, currentUser);

    const res = await fetch("http://localhost:5000/buy",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            name: currentUser,
            asset: asset,
            price: price
        })

    });

    const user = await res.json();

    console.log(user);

    if(user.error){
        alert(user.error);
        return;
    }

    wallet = user.wallet;
    portfolio = user.portfolio;

    document.getElementById("wallet").innerText = wallet.toFixed(2);

    updateDashboard();
    showLearningToast(asset);
}

// SELL CUSTOM ASSET
async function sellAssetCustom(asset) {
    if (!currentUser) return;

    let investedInAsset = portfolio[asset];
    if (investedInAsset <= 0) {
        alert("You don't have any investments in " + asset.toUpperCase() + " to sell.");
        return;
    }

    let sellAmount = prompt(`You have ₹${investedInAsset.toFixed(2)} invested in ${asset.toUpperCase()}.\nHow much of this principal investment do you want to sell? (You will get current market value for this portion)`, investedInAsset.toFixed(2));
    
    if (sellAmount === null) return; // User cancelled
    
    sellAmount = parseFloat(sellAmount);
    
    if (isNaN(sellAmount) || sellAmount <= 0) {
        alert("Please enter a valid positive number.");
        return;
    }
    
    if (sellAmount > investedInAsset) {
        alert("You cannot sell more than what you have invested (₹" + investedInAsset.toFixed(2) + ").");
        return;
    }

    // Calculate current market value for the sold proportion
    let sellProportion = sellAmount / investedInAsset;
    let totalCurrentValue = investedInAsset * simulatedPrices[asset];
    let walletAmountToAdd = totalCurrentValue * sellProportion;

    const res = await fetch("http://localhost:5000/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: currentUser,
            asset: asset,
            investedAmountToDeduct: sellAmount,
            walletAmountToAdd: walletAmountToAdd
        })
    });

    const user = await res.json();
    if(user.error){
        alert(user.error);
        return;
    }

    wallet = user.wallet;
    portfolio = user.portfolio;

    document.getElementById("wallet").innerText = wallet.toFixed(2);
    updateDashboard();
}

let simulatedPrices = {
    gold: 1.0,
    stocks: 1.0,
    crypto: 1.0,
    fd: 1.0
};

// MARKET SIMULATION (runs every 5 seconds)
setInterval(() => {
    // Gold: Very Low volatility (-0.2% to +0.4%)
    simulatedPrices.gold *= (1 + (Math.random() * 0.006 - 0.002));
    // Stocks: Low volatility (-0.5% to +1%)
    simulatedPrices.stocks *= (1 + (Math.random() * 0.015 - 0.005));
    // Crypto: High volatility (-2% to +3%)
    simulatedPrices.crypto *= (1 + (Math.random() * 0.05 - 0.02));
    // FD: Fixed growth (+0.01% every tick)
    simulatedPrices.fd *= 1.0001;

    if(currentUser) updateDashboard();
}, 5000);

// DASHBOARD UPDATE
function updateDashboard(){

    let invested =
        portfolio.gold +
        portfolio.stocks +
        portfolio.crypto +
        portfolio.fd;

    let currentValue = {
        gold: portfolio.gold * simulatedPrices.gold,
        stocks: portfolio.stocks * simulatedPrices.stocks,
        crypto: portfolio.crypto * simulatedPrices.crypto,
        fd: portfolio.fd * simulatedPrices.fd
    };

    let totalCurrentValue = currentValue.gold + currentValue.stocks + currentValue.crypto + currentValue.fd;
    let totalWealth = wallet + totalCurrentValue;

    // --- SMART RECOMMENDATION ---
    let recArea = document.getElementById("recommendationArea");
    let recText = document.getElementById("recommendationText");
    if (recText && recArea) {
        let cryptoPct = (currentValue.crypto / totalWealth) * 100;
        let safePct = ((currentValue.gold + currentValue.fd) / totalWealth) * 100;
        let stockPct = (currentValue.stocks / totalWealth) * 100;

        if (invested === 0) {
            recText.innerHTML = "<strong>Recommendation:</strong> Your virtual ₹1,00,000 cash is sitting idle! Start by investing a small amount in a safe asset like FD or Gold to learn the ropes.";
        } else if (cryptoPct > 50) {
            recText.innerHTML = "<strong>Recommendation:</strong> Warning! You have over 50% in Crypto. This is highly risky. Consider diversifying into FD or Gold to stabilize your portfolio.";
        } else if (wallet / totalWealth > 0.8) {
            recText.innerHTML = "<strong>Recommendation:</strong> You have over 80% of your wealth in cash. Cash loses value to inflation over time. Consider building a balanced portfolio slowly.";
        } else if (safePct > 80 && totalWealth > 105000) {
            recText.innerHTML = "<strong>Recommendation:</strong> You're playing it very safe. While good for capital protection, adding a small amount of Stocks could boost your long-term growth.";
        } else if (stockPct > 20 && safePct > 20 && cryptoPct <= 20) {
            recText.innerHTML = "<strong>Recommendation:</strong> 🌟 Excellent! You have a well-diversified portfolio. This is the hallmark of a smart investor.";
        } else if (currentValue.gold === totalCurrentValue || currentValue.stocks === totalCurrentValue || currentValue.crypto === totalCurrentValue || currentValue.fd === totalCurrentValue) {
            recText.innerHTML = "<strong>Recommendation:</strong> 🥚 Don't put all your eggs in one basket! You are 100% invested in a single asset. Diversification is key to managing risk.";
        } else {
            recText.innerHTML = "<strong>Recommendation:</strong> You're on track! Keep monitoring your portfolio and adjust allocations if market conditions change significantly.";
        }
    }

    // --- P&L Displays ---
    function updatePL(elementId, original, current) {
        let el = document.getElementById(elementId);
        if (!el || original === 0) {
            if(el) el.innerText = "";
            return;
        }
        let diff = current - original;
        let percent = ((diff / original) * 100).toFixed(2);
        if (diff >= 0) {
            el.innerText = `▲ +₹${diff.toFixed(2)} (+${percent}%)`;
            el.style.color = "#10b981"; // green
        } else {
            el.innerText = `▼ -₹${Math.abs(diff).toFixed(2)} (${percent}%)`;
            el.style.color = "#ef4444"; // red
        }
    }

    updatePL("goldPL", portfolio.gold, currentValue.gold);
    updatePL("stocksPL", portfolio.stocks, currentValue.stocks);
    updatePL("cryptoPL", portfolio.crypto, currentValue.crypto);
    updatePL("fdPL", portfolio.fd, currentValue.fd);


    // Update basic totals
    let investedEl = document.getElementById("invested");
    if (investedEl) investedEl.innerText = invested.toFixed(2);

    // Calculate and display Overall Return
    let overallReturnEl = document.getElementById("overallReturn");
    let overallReturnPercentEl = document.getElementById("overallReturnPercent");
    
    if (overallReturnEl && overallReturnPercentEl) {
        if (invested === 0) {
            overallReturnEl.innerText = "0.00";
            overallReturnEl.style.color = "#1e293b";
            overallReturnPercentEl.innerText = "";
        } else {
            let totalDiff = totalCurrentValue - invested;
            let percentDiff = ((totalDiff / invested) * 100).toFixed(2);
            overallReturnEl.innerText = `${totalDiff >= 0 ? '+' : '-'}${Math.abs(totalDiff).toFixed(2)}`;
            overallReturnPercentEl.innerText = `${totalDiff >= 0 ? '▲ +' : '▼ -'}${Math.abs(percentDiff)}%`;
            
            if (totalDiff >= 0) {
                overallReturnEl.style.color = "#10b981";
                overallReturnPercentEl.style.color = "#10b981";
            } else {
                overallReturnEl.style.color = "#ef4444";
                overallReturnPercentEl.style.color = "#ef4444";
            }
        }
    }

    // --- INVESTMENT GOAL ($150,000) ---
    let goalTarget = 150000;
    let progressPercent = Math.min((totalWealth / goalTarget) * 100, 100);
    let pgBar = document.getElementById("goalProgress");
    if (pgBar) pgBar.style.width = progressPercent + "%";
    
    let wealthText = document.getElementById("currentWealth");
    if (wealthText) wealthText.innerText = totalWealth.toFixed(2);
    
    // Check Goal Completion
    if(totalWealth >= goalTarget && progressPercent === 100) {
        if(pgBar) pgBar.style.background = "linear-gradient(to right, #f59e0b, #d97706)"; // Gold when reached
    }


    // --- RISK WARNING SYSTEM ---
    let warningArea = document.getElementById("riskWarningArea");
    let warningText = document.getElementById("riskWarningText");
    let riskEl = document.getElementById("risk");

    if (invested > 0) {
        let baseWealth = invested + wallet;
        let cryptoPercent = (portfolio.crypto / baseWealth) * 100;
        let stocksPercent = (portfolio.stocks / baseWealth) * 100;
        let safePercent = ((portfolio.gold + portfolio.fd) / baseWealth) * 100;
        
        let warnings = [];

        if (cryptoPercent > 50) {
            warnings.push("You have allocated more than 50% in Crypto. This is extremely risky for a beginner!");
        } else if (stocksPercent + cryptoPercent > 80) {
            warnings.push("Your portfolio is highly aggressive. Consider adding Gold or FD to protect against market crashes.");
        }

        if (warnings.length > 0 && warningArea && warningText) {
            warningArea.style.display = "block";
            warningText.innerHTML = warnings.join("<br><br>");
        } else if (warningArea) {
            warningArea.style.display = "none";
        }

        // Risk Score
        let score =
            (portfolio.gold*2 +
             portfolio.stocks*3 +
             portfolio.crypto*4 +
             portfolio.fd*1) / invested;

        if (riskEl) {
            riskEl.innerText = score.toFixed(2);
            if(score > 3.0) {
                riskEl.style.color = "#ef4444"; // Red for high risk
                riskEl.innerText += " (High)";
            } else if(score > 2.0) {
                riskEl.style.color = "#f59e0b"; // Yellow for moderate
                riskEl.innerText += " (Moderate)";
            } else {
                riskEl.style.color = "#10b981"; // Green for safe
                riskEl.innerText += " (Safe)";
            }
        }
    } else {
        if (riskEl) riskEl.innerText = "0 (Safe)";
        if (warningArea) warningArea.style.display = "none";
    }

    let goldEl = document.getElementById("goldInvested");
    if (goldEl) goldEl.innerText = currentValue.gold.toFixed(2);

    let stocksEl = document.getElementById("stocksInvested");
    if (stocksEl) stocksEl.innerText = currentValue.stocks.toFixed(2);

    let cryptoEl = document.getElementById("cryptoInvested");
    if (cryptoEl) cryptoEl.innerText = currentValue.crypto.toFixed(2);

    let fdEl = document.getElementById("fdInvested");
    if (fdEl) fdEl.innerText = currentValue.fd.toFixed(2);

    updateChart(currentValue);
}

// CHART UPDATE
function updateChart(currentValue = portfolio) {
    const ctx = document.getElementById('portfolioChart');
    const chartSection = document.getElementById('portfolioChartSection');
    if (!ctx) return;

    let totalInvested = currentValue.gold + currentValue.stocks + currentValue.crypto + currentValue.fd;
    if (totalInvested <= 0.01) {
        if (chartSection) chartSection.style.display = 'none';
        return;
    } else {
        if (chartSection) chartSection.style.display = 'block';
    }

    const data = [currentValue.gold, currentValue.stocks, currentValue.crypto, currentValue.fd];

    if (portfolioChartInstance) {
        portfolioChartInstance.data.datasets[0].data = data;
        portfolioChartInstance.update();
    } else {
        portfolioChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Gold', 'Stocks', 'Crypto', 'FD'],
                datasets: [{
                    label: 'Investment (₹)',
                    data: data,
                    backgroundColor: [
                        '#FFD700', // Gold
                        '#1E90FF', // Stocks
                        '#FF8C00', // Crypto
                        '#32CD32'  // FD
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }
}


// LOGOUT
function logout(){

    document.getElementById("dashboardSection").style.display="none";
    document.querySelector(".main-container").style.display="flex";
    document.getElementById("investInfo").style.display="none";

}


// ABOUT SCROLL
function scrollToInvestInfo(){

    let section = document.getElementById("investInfo");

    section.style.display="block";

    section.scrollIntoView({
        behavior:"smooth"
    });

}

// LEARNING TOAST
function showLearningToast(asset) {
    let title = "Learning Moment";
    let message = "";

    if (asset === 'gold') {
        message = "<strong>Thinking:</strong> I want to protect my money.<br><strong>Consequence:</strong> Your money is safer from major crashes.<br><strong>Learning:</strong> Gold acts as a shield against inflation but typically has lower long-term returns.";
    } else if (asset === 'stocks') {
        message = "<strong>Thinking:</strong> I want high long-term growth.<br><strong>Consequence:</strong> Your portfolio is exposed to market ups & downs.<br><strong>Learning:</strong> Stocks offer great returns over years, but require patience to ride out volatility.";
    } else if (asset === 'crypto') {
        message = "<strong>Thinking:</strong> I want massive, fast returns.<br><strong>Consequence:</strong> You face massive risk of sudden loss.<br><strong>Learning:</strong> Crypto changes wildly. Only invest small amounts you can afford to lose.";
    } else if (asset === 'fd') {
        message = "<strong>Thinking:</strong> I want guaranteed returns.<br><strong>Consequence:</strong> You earn slow, steady interest with zero risk.<br><strong>Learning:</strong> FDs are perfectly safe, but might not beat inflation over time.";
    }

    document.getElementById("toastTitle").innerHTML = title;
    document.getElementById("toastMessage").innerHTML = message;
    
    let toast = document.getElementById("learningToast");
    toast.classList.remove("hidden");
    // Small delay to allow CSS transition to apply
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Hide after 12 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 400); // match CSS transition duration
    }, 12000);
}

