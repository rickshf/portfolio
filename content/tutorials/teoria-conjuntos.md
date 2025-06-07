---
title: "Introdução à Teoria de Conjuntos"
date: 2024-06-19
description: "Mini artigo básico sobre teoria dos conjuntos, com fórmulas renderizadas via KaTeX."
math: true
---

A **Teoria de Conjuntos** é o ramo da matemática que estuda coleções de objetos, chamados de **conjuntos**. Cada objeto é chamado de **elemento** e indicamos que um elemento pertence a um conjunto escrevendo $a \in A$.

## Conjuntos e Subconjuntos
Um conjunto pode ser definido listando seus elementos, por exemplo:
$$A = \{1, 2, 3\}.$$
Um conjunto $B$ é **subconjunto** de $A$ (escrevemos $B \subseteq A$) se todo elemento de $B$ também pertencer a $A$.

O **conjunto vazio**, representado por $\emptyset$, não possui elementos e é subconjunto de qualquer conjunto.

## Operações Básicas
- **União ($\cup$)**: reúne todos os elementos que estão em $A$ ou em $B$.
  $$A \cup B = \{x \mid x \in A \ \text{ou} \ x \in B\}.$$ 
- **Interseção ($\cap$)**: reúne apenas os elementos presentes em ambos os conjuntos.
  $$A \cap B = \{x \mid x \in A \ \text{e} \ x \in B\}.$$ 
- **Diferença ($A \setminus B$)**: elementos que estão em $A$ mas não em $B$.
- **Complemento**: se $U$ é o universo considerado, o complemento de $A$ é $U \setminus A$, ou seja, todos os elementos de $U$ que não pertencem a $A$.

## Produtos de Conjuntos
O **produto cartesiano** $A \times B$ é o conjunto de pares ordenados $(a, b)$ em que $a \in A$ e $b \in B$.

## Considerações Finais
Os conceitos apresentados formam a base para muitos tópicos da matemática moderna. A notação de conjuntos fornece uma linguagem comum que facilita a descrição de estruturas e relações em diversas áreas.
