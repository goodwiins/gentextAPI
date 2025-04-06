def mod_exp(base, exponent, modulus):
    result = 1
    base = base % modulus
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * base) % modulus
        base = (base * base) % modulus
        exponent = exponent // 2
    return result

n = 1729
a = 1402
r = 27
u = 6

# Compute a^r mod n
first_value = mod_exp(a, r, n)
print(f"a^r mod n = {first_value}")

# Compute the sequence
sequence = []
current = first_value
for i in range(u):
    current = (current * current) % n
    sequence.append(current)

print("Sequence:", sequence) 