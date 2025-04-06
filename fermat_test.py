def mod_exp(base, exponent, modulus):
    result = 1
    base = base % modulus
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * base) % modulus
        base = (base * base) % modulus
        exponent = exponent // 2
    return result

n = 339
n_minus_1 = 338
liars = []
witnesses = []

# Test all numbers from 2 to n-2
for a in range(2, n-1):
    result = mod_exp(a, n_minus_1, n)
    if result == 1:
        liars.append(a)
    else:
        witnesses.append(a)

print(f"First Fermat Liar: {liars[0] if liars else 'None'}")
print(f"First Fermat Witness: {witnesses[0] if witnesses else 'None'}")
print(f"Number of Fermat Liars: {len(liars)}") 