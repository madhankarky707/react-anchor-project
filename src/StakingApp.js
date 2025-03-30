import React, { useState, useEffect } from "react";
import {
    Connection, PublicKey, SystemProgram
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, Program, BN } from "@project-serum/anchor";
import { SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

const STAKING_PROGRAM_ID = new PublicKey("4C5Mt9STsk9BpMdKso5Yt6SEaVme65pX3XYzBrJ6Uy9t");
const MINTER_ADDRESS = new PublicKey("8RvKQkG3fBKWAJZGxRCKsxDThXUpHEBAgr5DzkSGWMhr");
const IDL_PATH = "/staking_contract.json";
const NETWORK = "http://localhost:8899";

const StakingApp = () => {
    const [wallet, setWallet] = useState(null);
    const [program, setProgram] = useState(null);
    const [stakeAmount, setStakeAmount] = useState("");
    const [stakeDuration, setStakeDuration] = useState("");

    const connection = new Connection(NETWORK, "processed");

    const getStakingAccount = (userPubKey) => {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("staking_account"), userPubKey.toBuffer()],
            STAKING_PROGRAM_ID
        )[0];
    };

    const getStakingVault = (userPubKey) => {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("staking_vault"), userPubKey.toBuffer()],
            STAKING_PROGRAM_ID
        )[0];
    };

    const loadIDL = async (walletPublicKey) => {
        if (!window.solana || !walletPublicKey) return;
        const idl = await (await fetch(IDL_PATH)).json();
        const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: "processed" });
        setProgram(new Program(idl, STAKING_PROGRAM_ID, provider));
    };

    const connectWallet = async () => {
        try {
            const response = await window.solana.connect();
            setWallet(response.publicKey);
            await loadIDL(response.publicKey);
        } catch (err) {
            console.error(err);
        }
    };

    const stakeTokens = async () => {
        if (!program || !wallet) return;

        const amount = new BN(parseInt(stakeAmount));
        const duration = new BN(parseInt(stakeDuration));

        if (amount.lten(0) || duration.lten(0)) {
            alert("Enter valid values.");
            return;
        }

        const stakingAccount = getStakingAccount(wallet);
        const stakingVault = getStakingVault(wallet);
        const userTokenAccount = await getAssociatedTokenAddress(MINTER_ADDRESS, wallet);

        console.log("Staking Account:", stakingAccount.toBase58());
        console.log("Staking Vault:", stakingVault.toBase58());

        try {
            const tx = await program.rpc.stake(amount, duration, {
                accounts: {
                    user: wallet,
                    stakingAccount,
                    userTokenAccount,
                    stakingVault,
                    mint: MINTER_ADDRESS,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                },
                signers: []
            });

            console.log("Transaction successful:", tx);
            alert("Staked! TX ID: " + tx);
        } catch (err) {
            console.error("Staking failed:", err);
            alert("Staking failed: " + err.message);
        }
    };

    const unstakeTokens = async () => {
        if (!program || !wallet) return;

        const stakingAccount = getStakingAccount(wallet);
        const stakingVault = getStakingVault(wallet);
        const userTokenAccount = await getAssociatedTokenAddress(MINTER_ADDRESS, wallet);

        console.log("Unstaking Account:", stakingAccount.toBase58());
        console.log("Unstaking Vault:", stakingVault.toBase58());

        try {
            const tx = await program.rpc.unstake({
                accounts: {
                    user: wallet,
                    stakingAccount,
                    userTokenAccount,
                    stakingVault,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
            });
            alert("Unstaked! TX ID: " + tx);
        } catch (err) {
            console.error("Unstaking failed", err);
        }
    };

    const claimReward = async () => {
        if (!program || !wallet) return;

        const stakingAccount = getStakingAccount(wallet);
        const stakingVault = getStakingVault(wallet);
        const userTokenAccount = await getAssociatedTokenAddress(MINTER_ADDRESS, wallet);

        console.log("Claiming Reward Account:", stakingAccount.toBase58());
        console.log("Claiming Reward Vault:", stakingVault.toBase58());

        try {
            const tx = await program.rpc.claimReward({
                accounts: {
                    user: wallet,
                    stakingAccount,
                    userTokenAccount,
                    stakingVault,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
            });
            alert("Reward Claimed! TX ID: " + tx);
        } catch (err) {
            console.error("Claiming reward failed", err);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Solana Staking dApp</h1>
            <button onClick={connectWallet}>
                {wallet ? `Wallet: ${wallet.toBase58().slice(0, 6)}...` : "Connect Wallet"}
            </button>

            {wallet && (
                <div className="container">
                    <div className="section">
                        <input
                            type="number"
                            placeholder="Amount to Stake"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Stake Duration (in seconds)"
                            value={stakeDuration}
                            onChange={(e) => setStakeDuration(e.target.value)}
                        />
                        <button onClick={stakeTokens}>Stake</button>
                    </div>

                    <div className="section">
                        <h2>Unstake Tokens</h2>
                        <button onClick={unstakeTokens}>Unstake</button>
                    </div>

                    <div className="section">
                        <h2>Claim Reward</h2>
                        <button onClick={claimReward}>Claim Reward</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StakingApp;
