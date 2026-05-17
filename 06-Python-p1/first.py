def calc_si(p, r, t):
    simple_interest = (p * r * t)/100
    return simple_interest

if __name__ == '__main__':
    principal = int(input("Enter the principal amount: "))
    rate_of_interest = float(input("Enter the rate of interest: "))
    time_in_months = float(input("Enter the time in months: "))

    # print(type(principal), type(rate_of_interest), type(time_in_months))
    simple_interest = calc_si(principal, rate_of_interest, time_in_months)

    print(f"The principal {principal} saved for {time_in_months} months at {rate_of_interest} rate yields {simple_interest:.2f} in interest.")