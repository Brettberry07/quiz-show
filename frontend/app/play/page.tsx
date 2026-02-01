"use client";

import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, Hand, Plus, X } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionBuilder, Question } from "@/components/QuestionBuilder";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/context/UserContext";
import { useGame } from "@/context/GameContext";

interface QuestionEventPayload {
  question?: Question | null;
  timeRemainingMs?: number | null;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  state?: string;
}

interface StateEventPayload {
  currentQuestionIndex?: number;
}

interface JoinGameResponse {
  status?: string;
  data?: {
    pin: string;
    playerId?: string;
    rejoined?: boolean;
  };
}

interface SyncStateResponse {
  data?: {
    state?: string;
    question?: Question | null;
    timeRemainingMs?: number | null;
    currentQuestionIndex?: number;
    totalQuestions?: number;
  };
}

const ANSWER_ICONS = [
  <svg key="pipe" className="w-16 h-16 md:w-24 md:h-24" viewBox="0 0 279 278" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M241.181 213.133H232.5V194.6C232.5 143.499 190.78 101.933 139.5 101.933C129.241 101.933 120.9 93.6208 120.9 83.4V64.8668H129.581C135.05 64.8668 139.5 60.433 139.5 54.9837V37.6831C139.5 32.2344 135.05 27.8 129.581 27.8H120.9V9.88312C120.9 4.43388 116.45 0 110.982 0H56.4186C50.9503 0 46.5 4.43388 46.5 9.88312V27.8H37.8188C32.35 27.8 27.9001 32.2339 27.9001 37.6831V54.9837C27.9001 60.4324 32.35 64.8668 37.8188 64.8668H46.5005V83.4C46.5005 134.497 88.2203 176.067 139.501 176.067C149.759 176.067 158.101 184.379 158.101 194.6V213.133H149.419C143.951 213.133 139.5 217.567 139.5 223.016V240.317C139.5 245.766 143.95 250.2 149.419 250.2H158.101V268.117C158.101 273.566 162.55 278 168.019 278H222.582C228.051 278 232.501 273.566 232.501 268.117V250.2H241.183C246.651 250.2 251.101 245.766 251.101 240.317V223.016C251.1 217.568 246.65 213.133 241.181 213.133ZM51.1503 55.6H37.8188C37.4793 55.6 37.2003 55.322 37.2003 54.9837V37.6831C37.2003 37.3405 37.4793 37.0668 37.8188 37.0668H51.1503H116.251H129.582C129.922 37.0668 130.201 37.34 130.201 37.6831V54.9837C130.201 55.322 129.922 55.6 129.582 55.6H116.251H51.1503ZM241.8 240.317C241.8 240.655 241.521 240.933 241.181 240.933H227.85H162.75H149.419C149.079 240.933 148.8 240.655 148.8 240.317V223.016C148.8 222.674 149.079 222.4 149.419 222.4H162.75H227.851H241.182C241.522 222.4 241.801 222.674 241.801 223.016V240.317H241.8Z" fill="currentColor"/>
  </svg>,
  <svg key="mirror" className="w-16 h-16 md:w-24 md:h-24" viewBox="0 0 238 238" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M180.354 35.3638C164.065 12.559 142.276 0 119 0C95.7249 0 73.9357 12.559 57.6465 35.3638C41.6525 57.7563 32.8438 87.4588 32.8438 119C32.8438 150.541 41.6525 180.244 57.6465 202.636C73.9357 225.441 95.7249 238 119 238C142.275 238 164.064 225.441 180.354 202.636C196.348 180.244 205.156 150.541 205.156 119C205.156 87.4588 196.348 57.7563 180.354 35.3638ZM119 229.905C75.9574 229.905 40.939 180.153 40.939 119C40.939 57.847 75.9574 8.09524 119 8.09524C162.043 8.09524 197.062 57.847 197.062 119C197.062 180.153 162.044 229.905 119 229.905Z" fill="currentColor"/>
    <path d="M163.784 47.1998C151.423 29.8938 135.518 20.363 119 20.363C102.483 20.363 86.5778 29.8938 74.2169 47.1998C60.6682 66.1675 53.2065 91.667 53.2065 119C53.2065 146.334 60.6682 171.833 74.2169 190.801C86.5778 208.106 102.482 217.638 119 217.638C135.518 217.638 151.423 208.107 163.784 190.801C177.332 171.833 184.794 146.334 184.794 119C184.794 91.6675 177.332 66.168 163.784 47.1998ZM157.196 51.9053C158.563 53.818 159.858 55.8088 161.09 57.8629L73.9719 174.857C66.8745 161.1 62.5965 144.794 61.556 127.382L133.067 31.3472C141.83 34.9852 150.109 41.9827 157.196 51.9053ZM80.8043 51.9053C91.6039 36.785 105.169 28.4583 119 28.4583C120.929 28.4583 122.851 28.6261 124.762 28.9456L61.3898 114.05C62.2219 90.287 69.0408 68.3743 80.8043 51.9053ZM78.3736 182.501L165.32 65.7368C167.125 69.5011 168.726 73.4419 170.115 77.5311L85.145 191.634C83.6554 189.904 82.2059 188.058 80.8043 186.096C79.9683 184.925 79.1593 183.725 78.3736 182.501ZM157.196 186.095C146.397 201.215 132.832 209.542 119 209.542C109.189 209.542 99.5124 205.347 90.8607 197.514L172.956 87.2696C175.415 97.2759 176.698 107.968 176.698 119C176.699 144.661 169.773 168.489 157.196 186.095Z" fill="currentColor"/>
  </svg>,
  <svg key="layer" className="w-16 h-16 md:w-24 md:h-24" viewBox="0 0 228 229" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_12_8)">
      <path fillRule="evenodd" clipRule="evenodd" d="M115.41 1.24862C117.776 0.803782 120.22 1.07346 122.433 2.02355C124.646 2.97365 126.529 4.5615 127.844 6.58639C129.159 8.61128 129.847 10.9823 129.821 13.3997C129.794 15.817 129.055 18.1723 127.696 20.1676C126.337 22.1629 124.419 23.7088 122.186 24.6097C119.952 25.5107 117.503 25.7263 115.147 25.2292C112.791 24.7322 110.635 23.5449 108.952 21.8174C107.268 20.0899 106.132 17.8998 105.687 15.5238C105.392 13.9453 105.409 12.3237 105.738 10.7518C106.066 9.17983 106.7 7.68839 107.603 6.36267C108.506 5.03695 109.66 3.90294 111 3.02544C112.339 2.14795 113.838 1.54417 115.41 1.24862ZM195.195 146.014C193.92 143.732 192.029 141.858 189.74 140.609L192.913 138.857C196.038 137.123 198.353 134.217 199.351 130.773C200.349 127.33 199.948 123.63 198.238 120.482C196.921 118.056 194.885 116.102 192.412 114.891L194.972 113.475C196.532 112.621 197.908 111.467 199.023 110.078C200.138 108.689 200.969 107.092 201.469 105.38C201.969 103.668 202.127 101.874 201.936 100.101C201.745 98.3269 201.207 96.6086 200.353 95.0439C198.62 91.9117 195.725 89.5941 192.298 88.5958C188.872 87.5976 185.191 87.9995 182.058 89.714L179.442 91.3167C179.654 88.8768 179.204 86.4247 178.137 84.2219C177.071 82.0192 175.429 80.1485 173.388 78.8094C171.346 77.4703 168.98 76.7129 166.544 76.6182C164.107 76.5235 161.69 77.0949 159.551 78.2715L146.136 85.7259C144.639 82.4676 142.061 79.8327 138.844 78.2715C136.003 76.8979 132.813 76.4235 129.697 76.911L131.163 73.892C132.959 70.1851 133.215 65.9133 131.876 62.0164C131.212 60.0869 130.177 58.3075 128.829 56.7798C127.481 55.2521 125.847 54.0061 124.019 53.1128C120.328 51.3087 116.075 51.0512 112.195 52.3967C108.316 53.7423 105.127 56.5807 103.331 60.2877L101.846 63.3626C100.299 60.6762 97.9939 58.5103 95.2222 57.1382C91.5304 55.3459 87.2818 55.0966 83.4073 56.445C79.5328 57.7934 76.3486 60.6295 74.5523 64.3317L42.3785 130.452C41.6481 131.531 40.9911 132.658 40.4117 133.826L38.5562 137.721L38.3707 137.236C37.0718 133.807 35.8843 130.303 35.4205 128.999C32.3961 120.128 26.607 115.73 20.7623 114.891C18.1862 114.507 15.5549 114.816 13.1363 115.786C10.6877 116.773 8.52944 118.37 6.86481 120.426C2.78278 125.421 1.14997 133.472 5.10212 143.106V143.274C9.29548 155.648 19.1295 193.48 29.9283 205.388C43.2877 220.111 77.8922 233.939 96.5025 227.341C107.159 223.575 115.903 215.731 120.828 205.519L122.683 201.568C145.073 189.218 167.468 176.838 189.87 164.426C192.992 162.689 195.303 159.781 196.297 156.338C197.291 152.895 196.888 149.197 195.176 146.051L195.195 146.014ZM147.528 91.7267C152.482 89.0059 157.492 86.2663 162.483 83.4896C164.187 82.5624 166.185 82.3417 168.049 82.8746C168.978 83.14 169.845 83.5881 170.6 84.1927C171.355 84.7974 171.983 85.5465 172.447 86.3968C173.37 88.1086 173.59 90.1152 173.059 91.9876C172.792 92.9165 172.344 93.7832 171.743 94.538C171.141 95.2927 170.396 95.9207 169.552 96.3857L154.337 104.791C153.837 104.492 153.354 104.194 152.816 103.933C150.122 102.617 147.104 102.118 144.132 102.498L145.988 98.7712C147.04 96.5754 147.567 94.1633 147.528 91.7267ZM159.032 109.506L185.008 95.1558C186.715 94.2348 188.713 94.0208 190.575 94.5594C191.501 94.8242 192.366 95.2721 193.118 95.877C193.87 96.4818 194.494 97.2313 194.954 98.0816C195.877 99.7934 196.097 101.8 195.566 103.672C195.307 104.607 194.862 105.48 194.26 106.239C193.657 106.998 192.909 107.627 192.059 108.089L159.254 126.222L159.96 124.731C160.85 122.9 161.37 120.909 161.488 118.874C161.606 116.839 161.32 114.801 160.646 112.879C160.245 111.693 159.703 110.561 159.032 109.506ZM154.337 136.36L182.93 120.557C183.772 120.092 184.697 119.798 185.653 119.693C186.608 119.587 187.574 119.672 188.497 119.942C189.427 120.204 190.295 120.651 191.05 121.256C191.805 121.861 192.432 122.612 192.894 123.464C193.809 125.181 194.018 127.19 193.477 129.06C192.936 130.93 191.688 132.514 190 133.472L151.424 154.791L154.375 160.27L179.906 146.163C181.61 145.236 183.608 145.015 185.472 145.548C186.405 145.81 187.275 146.26 188.03 146.868C188.786 147.476 189.412 148.232 189.87 149.089C190.793 150.8 191.013 152.807 190.482 154.679C190.221 155.613 189.776 156.485 189.173 157.244C188.571 158.003 187.824 158.632 186.975 159.096L127.415 191.951L154.337 136.36ZM114.519 202.406C110.397 210.976 103.056 217.552 94.109 220.688C78.2447 226.279 46.3863 213.122 35.0308 200.617C25.4752 190.088 14.8619 150.132 11.7633 141C11.7282 140.835 11.6785 140.673 11.6148 140.516L8.36774 141.876L11.5963 140.516C8.72028 133.546 9.62946 128.067 12.2828 124.862C13.2114 123.719 14.4199 122.84 15.7896 122.309C17.0628 121.782 18.4532 121.609 19.816 121.805C23.2857 122.327 26.8111 125.234 28.8707 131.235C29.3531 132.614 30.5963 136.267 31.8951 139.696C32.8661 142.472 34.1092 145.143 35.606 147.672C35.9517 148.271 36.469 148.752 37.0904 149.051H40.189L46.9986 136.901C58.1685 113.531 69.4869 90.5899 80.8609 67.0898C81.8478 65.0745 83.5889 63.5334 85.7037 62.8035C86.7473 62.4307 87.8547 62.2716 88.9605 62.3356C90.0663 62.3996 91.1481 62.6855 92.1422 63.1763C94.1476 64.1598 95.6824 65.9025 96.4097 68.0216C96.7809 69.0698 96.9394 70.182 96.8756 71.2927C96.8119 72.4034 96.5273 73.49 96.0386 74.4884L73.9771 120.072L80.5084 123.278L109.658 63.1017C110.381 61.5865 111.539 60.3226 112.981 59.4718C114.424 58.6211 116.087 58.2222 117.757 58.3263C119.427 58.4304 121.028 59.0327 122.355 60.0561C123.682 61.0794 124.675 62.4773 125.207 64.0708C125.57 65.1179 125.723 66.2272 125.656 67.3341C125.589 68.4411 125.304 69.5237 124.817 70.5189L95.6675 130.695L102.347 133.956L124.483 88.279C124.969 87.2793 125.647 86.386 126.478 85.6504C127.309 84.9148 128.277 84.3514 129.326 83.9928C130.901 83.4524 132.6 83.3918 134.209 83.8184C135.818 84.245 137.266 85.1399 138.37 86.3905C139.475 87.6412 140.187 89.1918 140.416 90.8475C140.646 92.5032 140.383 94.1901 139.661 95.6962L117.506 141.355L123.834 144.448L138.455 114.239C138.941 113.239 139.619 112.346 140.45 111.61C141.281 110.875 142.249 110.311 143.297 109.953C144.341 109.58 145.448 109.421 146.554 109.485C147.66 109.549 148.742 109.835 149.736 110.326C151.741 111.317 153.275 113.064 154.005 115.186C154.735 117.308 154.601 119.633 153.632 121.656C140.595 148.567 127.557 175.483 114.519 202.406ZM222.99 88.9127C221.99 87.9846 220.738 87.3753 219.393 87.1619C218.048 86.9485 216.67 87.1406 215.433 87.7139C214.197 88.2872 213.158 89.2159 212.447 90.3826C211.736 91.5492 211.386 92.9014 211.44 94.2681C211.495 95.6347 211.952 96.9544 212.753 98.0602C213.555 99.166 214.665 100.008 215.943 100.48C217.221 100.952 218.61 101.033 219.933 100.712C221.257 100.391 222.456 99.6835 223.379 98.678C223.996 98.0132 224.476 97.2322 224.791 96.3801C225.105 95.528 225.249 94.6218 225.212 93.7137C225.176 92.8056 224.961 91.9138 224.58 91.0897C224.198 90.2657 223.658 89.5257 222.99 88.9127ZM217.813 91.3167C218.336 91.2151 218.878 91.2718 219.369 91.4796C219.86 91.6874 220.278 92.037 220.571 92.484C220.864 92.931 221.018 93.4554 221.014 93.9905C221.01 94.5257 220.848 95.0476 220.548 95.49C220.248 95.9325 219.825 96.2756 219.331 96.4758C218.836 96.676 218.294 96.7243 217.773 96.6147C217.251 96.505 216.774 96.2423 216.401 95.8598C216.028 95.4773 215.777 94.9923 215.679 94.4662C215.549 93.7646 215.7 93.0397 216.1 92.4496C216.499 91.8595 217.115 91.4522 217.813 91.3167ZM210.929 51.1933C209.162 49.5454 206.947 48.4611 204.566 48.0775C202.185 47.6939 199.744 48.0283 197.552 49.0383C195.36 50.0483 193.516 51.6886 192.253 53.7517C190.989 55.8148 190.363 58.2079 190.454 60.6283C190.545 63.0488 191.348 65.3877 192.763 67.3493C194.178 69.311 196.14 70.8071 198.401 71.6484C200.663 72.4897 203.122 72.6385 205.467 72.0759C207.813 71.5132 209.94 70.2645 211.579 68.4875C213.774 66.1069 214.939 62.9482 214.818 59.7054C214.696 56.4626 213.297 53.401 210.929 51.1933ZM201.466 53.9141C202.699 53.6821 203.973 53.8223 205.127 54.317C206.28 54.8116 207.262 55.6386 207.948 56.6934C208.634 57.7482 208.993 58.9836 208.98 60.2434C208.968 61.5032 208.584 62.7309 207.876 63.7715C207.169 64.8122 206.171 65.6189 205.008 66.09C203.844 66.561 202.568 66.6752 201.34 66.418C200.112 66.1609 198.987 65.544 198.108 64.6453C197.229 63.7465 196.635 62.6063 196.401 61.3686C196.245 60.5449 196.253 59.6985 196.423 58.8778C196.593 58.0571 196.923 57.2782 197.394 56.5858C197.864 55.8933 198.466 55.3009 199.165 54.8424C199.864 54.384 200.646 54.0685 201.466 53.9141ZM161.054 0C165.099 18.6361 177.215 27.8423 177.215 37.123C177.215 46.4038 173.189 55.7591 161.073 55.7591C148.957 55.7591 144.912 46.4411 144.912 37.123C144.912 27.805 157.009 18.6361 161.054 0ZM86.1119 23.3696C87.4501 23.1313 88.8287 23.2962 90.0738 23.8435C91.3189 24.3909 92.3748 25.2962 93.1085 26.4453C93.8421 27.5945 94.2207 28.936 94.1964 30.3009C94.1721 31.6658 93.7461 32.9929 92.9721 34.115C92.198 35.2371 91.1106 36.1039 89.8469 36.6063C88.5831 37.1086 87.1995 37.2239 85.8706 36.9378C84.5417 36.6516 83.3268 35.9767 82.3792 34.9982C81.4315 34.0196 80.7935 32.7812 80.5455 31.439C80.3797 30.5417 80.3924 29.6204 80.5829 28.728C80.7733 27.8357 81.1378 26.99 81.6553 26.2399C82.1728 25.4897 82.833 24.8499 83.5979 24.3572C84.3628 23.8646 85.2172 23.529 86.1119 23.3696ZM86.8912 27.5255C87.4106 27.4276 87.9473 27.4867 88.4333 27.6952C88.9194 27.9037 89.3329 28.2523 89.6216 28.6969C89.9104 29.1416 90.0613 29.6622 90.0555 30.193C90.0496 30.7238 89.8871 31.2409 89.5885 31.6789C89.29 32.117 88.8688 32.4562 88.3783 32.6538C87.8878 32.8514 87.3499 32.8984 86.8328 32.789C86.3156 32.6795 85.8424 32.4185 85.473 32.0389C85.1036 31.6592 84.8545 31.1781 84.7574 30.6563C84.6322 29.9576 84.7859 29.2374 85.1852 28.6515C85.5845 28.0656 86.1973 27.6611 86.8912 27.5255ZM116.579 7.0258C117.812 6.79376 119.085 6.93394 120.239 7.42861C121.393 7.92328 122.374 8.75026 123.06 9.80508C123.746 10.8599 124.105 12.0952 124.093 13.355C124.08 14.6148 123.696 15.8426 122.989 16.8832C122.282 17.9238 121.283 18.7306 120.12 19.2016C118.956 19.6727 117.68 19.7868 116.452 19.5297C115.224 19.2725 114.1 18.6556 113.221 17.7569C112.342 16.8582 111.747 15.7179 111.513 14.4802C111.357 13.6566 111.365 12.8102 111.535 11.9895C111.706 11.1688 112.036 10.3899 112.506 9.69741C112.977 9.00495 113.579 8.41254 114.277 7.9541C114.976 7.49566 115.758 7.1802 116.579 7.0258Z" fill="currentColor"/>
    </g>
    <defs>
      <clipPath id="clip0_12_8">
        <rect width="228" height="229" fill="white"/>
      </clipPath>
    </defs>
  </svg>,
  <svg key="frame" className="w-16 h-16 md:w-24 md:h-24" viewBox="0 0 268 251" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_4_48)">
      <path d="M178.667 52.2918H117.25V31.3752H145.167C148.128 31.3752 150.969 30.2733 153.063 28.312C155.157 26.3507 156.333 23.6906 156.333 20.9168C156.333 18.1431 155.157 15.483 153.063 13.5217C150.969 11.5604 148.128 10.4585 145.167 10.4585H67C64.0384 10.4585 61.1981 11.5604 59.1039 13.5217C57.0098 15.483 55.8333 18.1431 55.8333 20.9168C55.8333 23.6906 57.0098 26.3507 59.1039 28.312C61.1981 30.2733 64.0384 31.3752 67 31.3752H94.9166V52.2918H50.25C48.0293 52.2188 45.8164 52.5746 43.7489 53.3371C41.6814 54.0996 39.8036 55.2526 38.2324 56.7241C36.6612 58.1956 35.4302 59.9543 34.6161 61.8906C33.8019 63.827 33.422 65.8995 33.5 67.9793V109.813C33.422 111.892 33.8019 113.965 34.6161 115.901C35.4302 117.838 36.6612 119.596 38.2324 121.068C39.8036 122.539 41.6814 123.692 43.7489 124.455C45.8164 125.217 48.0293 125.573 50.25 125.5H156.333V162.104C156.255 164.184 156.635 166.257 157.449 168.193C158.264 170.129 159.495 171.888 161.066 173.36C162.637 174.831 164.515 175.984 166.582 176.747C168.65 177.509 170.863 177.865 173.083 177.792H217.75C219.971 177.865 222.184 177.509 224.251 176.747C226.319 175.984 228.196 174.831 229.768 173.36C231.339 171.888 232.57 170.129 233.384 168.193C234.198 166.257 234.578 164.184 234.5 162.104V104.584C234.5 90.7149 228.618 77.4143 218.147 67.6077C207.676 57.8011 193.475 52.2918 178.667 52.2918ZM212.167 156.875H178.667V120.271C178.745 118.191 178.365 116.119 177.551 114.182C176.736 112.246 175.505 110.487 173.934 109.016C172.363 107.544 170.485 106.391 168.418 105.629C166.35 104.866 164.137 104.51 161.917 104.584H55.8333V73.2085H178.667C187.551 73.2085 196.072 76.5141 202.355 82.398C208.637 88.282 212.167 96.2623 212.167 104.584V156.875Z" fill="currentColor"/>
      <path d="M195.417 188.25L178.667 206.029C176.711 208.067 175.214 210.454 174.264 213.046C173.315 215.638 172.933 218.382 173.142 221.115C173.35 223.849 174.145 226.515 175.478 228.954C176.811 231.393 178.655 233.556 180.9 235.313C184.946 238.553 190.094 240.334 195.417 240.334C200.74 240.334 205.888 238.553 209.934 235.313C212.179 233.556 214.023 231.393 215.356 228.954C216.689 226.515 217.484 223.849 217.692 221.115C217.9 218.382 217.519 215.638 216.569 213.046C215.62 210.454 214.123 208.067 212.167 206.029L195.417 188.25Z" fill="currentColor"/>
    </g>
    <defs>
      <clipPath id="clip0_4_48">
        <rect width="268" height="251" fill="white"/>
      </clipPath>
    </defs>
  </svg>
];

export default function PlayPageWrapper() {
  return (
    <Suspense>
      <PlayPage />
    </Suspense>
  );
}

function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, fetchWithAuth } = useUser();
  const { connectSocket, emitWithAck, onEvent, offEvent } = useGame();
  const pin = searchParams.get("pin") || searchParams.get("code") || "";

  const [question, setQuestion] = useState<Question | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'adding_question'>('waiting');
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string>("");

  useEffect(() => {
    if (!pin) return;
    let mounted = true;

    const sync = async () => {
      try {
        await connectSocket();
        if (pin.length !== 6) throw new Error("Invalid game PIN");

        const joinResponse = await emitWithAck<JoinGameResponse>("join_game", { pin, nickname: username || "Player" });
        if (!mounted) return;
        if (!joinResponse || joinResponse.status !== "ok") {
          throw new Error("Failed to join game");
        }
        const joinedId = joinResponse.data?.playerId || "";
        setPlayerId(joinedId);
        if (joinedId) {
          sessionStorage.setItem("quizsink_player_id", joinedId);
        }
        const stateResponse = await emitWithAck<SyncStateResponse>("sync_state", { pin });
        const data = stateResponse?.data ?? {};
        setQuestion(data.question || null);
        setTimeRemainingMs(data.timeRemainingMs ?? null);
        setCurrentQuestionIndex(data.currentQuestionIndex ?? 0);
        setTotalQuestions(data.totalQuestions ?? 0);
        const normalized = (data.state || "LOBBY").toString().toUpperCase();
        if (normalized.includes("QUESTION_ACTIVE") || normalized === "QUESTION_ACTIVE") {
          setGameState("playing");
        } else if (normalized === "LOBBY") {
          setGameState((prev) => (prev === "adding_question" ? prev : "waiting"));
        }
      } catch (error) {
        console.error(error);
      }
    };

    const handleQuestion = (data: QuestionEventPayload) => {
      if (!mounted) return;
      setQuestion(data.question || null);
      setTimeRemainingMs(data.timeRemainingMs ?? null);
      setCurrentQuestionIndex(data.currentQuestionIndex ?? 0);
      setTotalQuestions(data.totalQuestions ?? 0);
      setGameState("playing");
    };

    const handleEnded = (data: StateEventPayload) => {
      if (!mounted) return;
      const nextIndex = (data?.currentQuestionIndex ?? currentQuestionIndex) + 1;
      router.push(`/play/leaderboard?pin=${pin}&q=${nextIndex}&total=${totalQuestions}&playerId=${playerId}`);
    };

    const handleLeaderboard = (data: StateEventPayload) => {
      if (!mounted) return;
      const nextIndex = (data?.currentQuestionIndex ?? currentQuestionIndex) + 1;
      router.push(`/play/leaderboard?pin=${pin}&q=${nextIndex}&total=${totalQuestions}&playerId=${playerId}`);
    };

    onEvent("question_active", handleQuestion as any);
    onEvent("question_ended", handleEnded as any);
    onEvent("leaderboard", handleLeaderboard as any);
    onEvent("game_ended", handleLeaderboard as any);

    void sync();

    return () => {
      mounted = false;
      offEvent("question_active", handleQuestion as any);
      offEvent("question_ended", handleEnded as any);
      offEvent("leaderboard", handleLeaderboard as any);
      offEvent("game_ended", handleLeaderboard as any);
    };
  }, [pin, username, emitWithAck, connectSocket, onEvent, offEvent, router, currentQuestionIndex, totalQuestions, playerId]);

  useEffect(() => {
    if (gameState !== "playing" || timeRemainingMs === null) {
      setDeadlineMs(null);
      return;
    }
    setDeadlineMs(Date.now() + timeRemainingMs);
  }, [gameState, timeRemainingMs, question?.text]);

  useEffect(() => {
    if (!deadlineMs) return;
    let mounted = true;
    const interval = setInterval(() => {
      const remaining = Math.max(0, deadlineMs - Date.now());
      if (mounted) {
        setTimeRemainingMs(remaining);
      }
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 250);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deadlineMs]);

  const handleAnswer = (selectedIndex: number) => {
    if (!pin) return;
    emitWithAck<{ data?: { points?: number; isCorrect?: boolean } }>("submit_answer", { pin, answerIndex: selectedIndex })
      .then((payload) => {
        const points = payload?.data?.points || 0;
        const isCorrect = payload?.data?.isCorrect || false;
        const pid = playerId || sessionStorage.getItem("quizsink_player_id") || "";
        router.push(`/play/leaderboard?pin=${pin}&q=${currentQuestionIndex + 1}&total=${totalQuestions}&points=${points}&correct=${isCorrect}&playerId=${pid}`);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleSuggestQuestion = () => {
    setGameState('adding_question');
  };

  const handleQuestionAdded = (q: Question) => {
    if (!pin) return;
    fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/quiz/game/${pin}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: q.text,
        category: q.category,
        author: q.author,
        type: q.type,
        timeLimitSeconds: q.timeLimitSeconds,
        pointsMultiplier: q.pointsMultiplier,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || "Failed to submit question");
        }
        alert("Thanks for your suggestion! The host might include it.");
        setGameState('waiting');
      })
      .catch((error) => {
        alert(error?.message || "Failed to submit question");
      });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
       {/* Top Bar */}
       <header className="sticky top-0 z-40 w-full bg-[#3D3030] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="hidden md:inline font-medium ml-4">{username || "Player"}</span>
            <div className="h-10 w-10 rounded-full bg-white/80" />
        </div>
      </header>

       <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {gameState === 'waiting' && (
             <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-6 w-full max-w-md"
             >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black text-[#1a1a1a]">You&apos;re In!</h1>
                    <p className="text-xl font-medium text-[#666]">See your nickname on screen</p>
                </div>

                <div className="flex justify-center py-4">
                     <div className="h-16 w-16 border-4 border-[#A59A9A] border-t-[#3D3030] rounded-full animate-spin" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <Card className="p-6 bg-white border-none shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Got a good question?</h3>
                        <Button 
                            onClick={handleSuggestQuestion}
                            className="w-full bg-[#202020] text-white hover:bg-[#333] font-bold h-12 border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Suggest a Question
                        </Button>
                    </Card>
                </motion.div>
             </motion.div>
          )}

          {gameState === 'adding_question' && (
             <motion.div
                key="adding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-2xl"
             >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black">Suggest Question</h2>
                    <Button 
                        variant="ghost" 
                        onClick={() => setGameState('waiting')}
                        className="hover:bg-gray-200"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </Button>
                </div>
                <QuestionBuilder 
                    onAddQuestion={handleQuestionAdded}
                    creatorName={username || "Player"} 
                />
             </motion.div>
          )}

          {gameState === 'playing' && (
             <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col flex-1 h-full"
             >
                 {/* Question Area */}
                 <div className="flex-1 flex items-center justify-center w-full mb-8">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center min-h-50 flex items-center justify-center"
                    >
                        <div className="space-y-4">
                          <h2 className="text-4xl font-black text-black">
                            {question?.text || "Loading question..."}
                          </h2>
                          {timeRemainingMs !== null && (
                            <p className="text-sm font-bold text-[#666]">
                              Time left: {Math.ceil(timeRemainingMs / 1000)}s
                            </p>
                          )}
                        </div>
                    </motion.div>
                 </div>

                 {/* Answer Grid */}
                 <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-96 pb-8">
                    {question?.options.map((option, index) => (
                      <GameButton 
                        key={index}
                        onClick={() => handleAnswer(index)}
                        icon={ANSWER_ICONS[index % ANSWER_ICONS.length]} 
                        color="bg-[#A59A9A]"
                        delay={index * 0.1}
                      />
                    )) || (
                      <>
                        <GameButton onClick={() => handleAnswer(0)} icon={ANSWER_ICONS[0]} color="bg-[#A59A9A]" delay={0} />
                        <GameButton onClick={() => handleAnswer(1)} icon={ANSWER_ICONS[1]} color="bg-[#A59A9A]" delay={0.1} />
                        <GameButton onClick={() => handleAnswer(2)} icon={ANSWER_ICONS[2]} color="bg-[#A59A9A]" delay={0.2} />
                        <GameButton onClick={() => handleAnswer(3)} icon={ANSWER_ICONS[3]} color="bg-[#A59A9A]" delay={0.3} />
                      </>
                    )}
                 </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GameButton({ icon, color, delay, onClick }: { icon: React.ReactNode, color: string, delay: number, onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`${color} rounded-xl shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center p-8 text-black`}
        >
            {icon}
        </motion.button>
    )
}
