import React, { useEffect, useState } from "react";
import { useContracts } from "../context/ContractContext.jsx";
import { ethers } from "ethers";
export default function TransactionsPage() {
  const { funding, account } = useContracts();
  const [transactions, setTransactions] = useState([]);

  // Fetch all transactions
   const fetchTransactions = async () => {
  if (!funding) return;

  try {
    const rawTxs = await funding.getAllTransactions(); // contract function
    const decodedTxs = rawTxs.map((tx, i) => {
      let amountEth = "0";

      // Safe conversion of amount
      if (tx.amount !== undefined && tx.amount !== null) {
        try {
          // If amount is a BigNumber
          amountEth = ethers.utils.formatEther(tx.amount);
        } catch {
          // If amount is a normal number/string in wei
          amountEth = (Number(tx.amount) / 1e18).toString();
        }
      }

      return {
        txId: i,
        donor: tx.donor || "N/A",
        patient: tx.patient || "N/A",
        amount: amountEth,
        timestamp: Number(tx.timestamp) || 0,
        txHash: tx.txHash || "N/A"
      };
    });

    setTransactions(decodedTxs);
    console.log("Fetched transactions:", decodedTxs);
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
};


  useEffect(() => {
    fetchTransactions();
  }, [funding]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        All Transactions
      </h1>

      {transactions.length === 0 ? (
        <p className="text-center text-gray-600">No transactions yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transactions.map((tx) => (
            <div
              key={tx.txId}
              className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition"
            >
              <p className="text-sm text-gray-500 mb-2">Transaction ID: {tx.txId}</p>
              <p className="text-sm text-gray-500 mb-2">
                Donor:{" "}
                <span className="text-gray-800 font-semibold">{tx.donor}</span>
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Patient:{" "}
                <span className="text-gray-800 font-semibold">{tx.patient}</span>
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Amount:{" "}
                <span className="text-gray-800 font-semibold">{tx.amount} ETH</span>
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Time:{" "}
                <span className="text-gray-800 font-semibold">
                  {new Date(tx.timestamp * 1000).toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-gray-500 truncate">
                Tx Hash:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {tx.txHash}
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
